#!/usr/bin/env gjs
import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

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
            let fontSize = options.lookup_value('font-size', null)?.get_int32();

            let shaderEffect = `
                #version 330 core
                in vec2 v_texcoord;
                out vec4 fragColor;
                uniform sampler2D tex;
                uniform float time;
                void main() {
                    vec4 color = texture(tex, v_texcoord);
                    fragColor = vec4(color.rgb * vec3(0.5 + 0.5 * sin(time), 1.0, 0.5), color.a);
                }
            `;

            if (shaderPath) {
                try {
                    let [success, shaderContent] = GLib.file_get_contents(shaderPath);
                    if (success) {
                        shaderEffect = shaderContent.toString();
                    }
                } catch (e) {
                    logError(e, `Failed to load shader from ${shaderPath}`);
                }
            }

            this.shaderEffect = shaderEffect;
            this.fontConfig = {
                family: fontFamily || 'Monospace',
                size: fontSize || 12,
            };

            app.activate();
        } catch (e) {
            logError(e, 'Error handling command line options');
        }
        return 0;
    }

    _onActivate() {
        try {
            let win = new TerminalWindow(this, this.shaderEffect, this.fontConfig);
            win.present();
        } catch (e) {
            logError(e, 'Error activating application');
        }
    }
});

let app = new TerminalApp();
app.add_main_option('shader', 's', GLib.OptionFlags.NONE, GLib.OptionArg.STRING, 'Path to the shader file to use', null);
app.add_main_option('font-family', 'f', GLib.OptionFlags.NONE, GLib.OptionArg.STRING, 'Font family to use', null);
app.add_main_option('font-size', 'z', GLib.OptionFlags.NONE, GLib.OptionArg.INT, 'Font size to use', null);
app.run([]);