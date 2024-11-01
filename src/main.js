#!/usr/bin/env gjs

imports.gi.versions.Gtk = '4.0';
imports.gi.versions.Adw = '1';

const { Gtk, Adw, Gio, Gdk, GLib, GObject } = imports.gi;

const TerminalWindow = GObject.registerClass(
class TerminalWindow extends Adw.ApplicationWindow {
    _init(app, shaderEffect, fontConfig) {
        super._init({
            application: app,
            title: 'term-retro-cool',
            default_width: 800,
            default_height: 600,
        });

        this.set_show_menubar(false);

        // Create a GtkBox to hold the terminal
        let box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
        this.set_child(box);

        // Create a new terminal
        let terminal = new Gtk.Widget();
        terminal.set_hexpand(true);
        terminal.set_vexpand(true);
        box.append(terminal);

        // Apply CSS for shader effects and font configuration
        let cssProvider = new Gtk.CssProvider();
        cssProvider.load_from_data(`
            widget {
                background: #000;
                color: #0f0;
                font-family: ${fontConfig.family};
                font-size: ${fontConfig.size}px;
            }
        `);
        Gtk.StyleContext.add_provider_for_display(
            Gdk.Display.get_default(),
            cssProvider,
            Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
        );

        // Add custom shader effects based on the selected shader effect
        let shader = new Gtk.GLShader();
        shader.set_source(shaderEffect);
        terminal.set_shader(shader);

        // Update shader parameters
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 16, () => {
            let time = GLib.get_monotonic_time() / 1000000.0;
            shader.set_uniform_float("time", time);
            return true; // Continue calling this function
        });
    }
}

const TerminalApp = GObject.registerClass(
class TerminalApp extends Adw.Application {
    _init() {
        super._init({
            application_id: 'com.example.term-retro-cool',
            flags: Gio.ApplicationFlags.HANDLES_COMMAND_LINE,
        });

        this.connect('command-line', this._onCommandLine.bind(this));
        this.connect('activate', this._onActivate.bind(this));
    }

    _onCommandLine(app, commandLine) {
        try {
            let options = commandLine.get_options_dict();
            let shaderPath = options.lookup_value('shader', null)?.get_string();
            let fontFamily = options.lookup_value('font-family', null)?.get_string();
        } catch (error) {
            logError(error);
        }
    }

    _onActivate() {
        // Activation logic here
    }
});

let app = new TerminalApp();
app.add_main_option('shader', 's', GLib.OptionFlags.NONE, GLib.OptionArg.STRING, 'Path to the shader file to use', null);
app.add_main_option('font-family', 'f', GLib.OptionFlags.NONE, GLib.OptionArg.STRING, 'Font family to use', null);
app.add_main_option('font-size', 'z', GLib.OptionFlags.NONE, GLib.OptionArg.INT, 'Font size to use', null);
app.run([]);