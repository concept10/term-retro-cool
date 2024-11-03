#!/usr/bin/env gjs

imports.gi.versions.Gtk = '4.0';
imports.gi.versions.Vte = '3.91';
const { Gtk, Vte, Clutter } = imports.gi;
const { Adw, GLib, GObject, Cogl } = imports.gi;
const ShaderLibrary = imports.shaders.shaderLibrary;

Gtk.init(null);
Adw.init();

const appSettings = {
    rasterization: 'scanline_rasterization',
    no_rasterization: 'no_rasterization',
    scanline_rasterization: 'scanline_rasterization',
    pixel_rasterization: 'pixel_rasterization'
};

const MainWindow = GObject.registerClass(
class MainWindow extends Adw.ApplicationWindow {
    _init(app) {
        super._init({
            application: app,
            title: 'GJS GTK4 Terminal App',
            default_width: 800,
            default_height: 600,
        });

        const box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
        this.set_child(box);

        const terminal = new Vte.Terminal();
        terminal.spawn_async(
            Vte.PtyFlags.DEFAULT,
            GLib.get_home_dir(),
            ['/bin/bash'],
            null,
            GLib.SpawnFlags.DO_NOT_REAP_CHILD,
            null,
            null,
            -1,
            null,
            (terminal, success) => {
                if (!success) {
                    print('Failed to spawn terminal');
                }
            }
        );
        box.append(terminal);

        const button = new Gtk.Button({ label: 'Close' });
        button.connect('clicked', () => this.close());
        box.append(button);

        // Initialize Clutter
        Clutter.init(null);

        // Create a Clutter stage
        const stage = new Clutter.Stage();
        stage.set_size(800, 600);
        stage.set_user_resizable(true);

        // Create a Clutter actor for the terminal
        const clutterTerminal = new Clutter.Actor();
        clutterTerminal.set_size(800, 600);
        stage.add_child(clutterTerminal);

        // Load the shader from the ShaderLibrary
        const shaderSource = ShaderLibrary.ShaderLibrary.getRasterizationShader(appSettings);
        const pipeline = new Cogl.Pipeline();
        const snippet = new Cogl.Snippet(
            Cogl.SnippetHook.FRAGMENT,
            shaderSource,
            null
        );
        pipeline.add_snippet(snippet);

        // Apply the shader to the Clutter actor
        clutterTerminal.set_content(pipeline);

        // Show the Clutter stage
        stage.show();
    }
});

const app = new Adw.Application({
    application_id: 'com.example.GjsGtk4App',
    flags: Gio.ApplicationFlags.FLAGS_NONE,
});

app.connect('activate', () => {
    const win = new MainWindow(app);
    win.present();
});

app.run([]);