/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const { GObject, St, Gio } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const ModalDialog = imports.ui.modalDialog;

const Clutter = imports.gi.Clutter;

const CUSTOM_CHARGE_START_KEY = 'custom-charge-start-charging';
const CUSTOM_CHARGE_STOP_KEY = 'custom-charge-stop-charging';

// Modal dialog to show the output of the command
const OutputModal = GObject.registerClass(
    class OutputModal extends ModalDialog.ModalDialog {
        _init(output) {
            super._init()
    
            let box = new St.BoxLayout({ vertical: true});
            this.contentLayout.add(box);
    
            box.add(new St.Label({ text: output}));
    
            this.setButtons([{ label: _('Close'),
                               action: () => { this.close(global.get_current_time()); },
                               key: Clutter.Escape
                             }]);
        }
    
    });

// Run terminal commands as root and display output in a modal
function priveledgedExec(args) {
    try {
        let proc = Gio.Subprocess.new(
            ['pkexec', '--user', 'root'].concat(args),
            Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
        );

        proc.communicate_utf8_async(null, null, (proc, res) => {
            try {
                let [, stdout, stderr] = proc.communicate_utf8_finish(res);

                // Failure
                if (!proc.get_successful())
                    throw new Error(stderr);

                // Success - show output in a modal
                let dialog = new OutputModal(stdout);
                dialog.open(global.get_current_time());
            } catch (e) {
                logError(e);
            }
        });
    } catch (e) {
        logError(e);
    }
}

class DellCommandControlMenuExtension {
    constructor(uuid) {
        this._uuid = uuid;

        ExtensionUtils.initTranslations(uuid);

        this.settings = ExtensionUtils.getSettings(Me.metadata['settings-schema']);
    }

    enable() {
        let powerMenu = Main.panel.statusArea.aggregateMenu._power._item.menu;

        this._separator = new PopupMenu.PopupSeparatorMenuItem()
        powerMenu.addMenuItem(this._separator);

        // Custom charge
        let customChargeStart = this.settings.get_uint(CUSTOM_CHARGE_START_KEY);
        let customChargeStop = this.settings.get_uint(CUSTOM_CHARGE_STOP_KEY);
        this._chargeCustom = new PopupMenu.PopupMenuItem(_('Charge Custom') + `=${customChargeStart}-${customChargeStop}`);
        // Connect to settings changes
        this.settings.connect(`changed::${CUSTOM_CHARGE_START_KEY}`, () => {
            customChargeStart = this.settings.get_uint(CUSTOM_CHARGE_START_KEY);
            this._chargeCustom.label.set_text(_('Charge Custom') + `=${customChargeStart}-${customChargeStop}`)
        });
        this.settings.connect(`changed::${CUSTOM_CHARGE_STOP_KEY}`, () => {
            customChargeStop = this.settings.get_uint(CUSTOM_CHARGE_STOP_KEY);
            this._chargeCustom.label.set_text(_('Charge Custom') + `=${customChargeStart}-${customChargeStop}`)
        });
        this._chargeCustom.connect('activate', () => {
            priveledgedExec(['/opt/dell/dcc/cctk', `--PrimaryBattChargeCfg=Custom:${customChargeStart}-${customChargeStop}`]);
        });
        powerMenu.addMenuItem(this._chargeCustom);

        // Standard charge
        this._chargeStandard = new PopupMenu.PopupMenuItem(_('Charge Standard'));
        this._chargeStandard.connect('activate', () => {
            priveledgedExec(['/opt/dell/dcc/cctk', '--PrimaryBattChargeCfg=Standard']);
        });
        powerMenu.addMenuItem(this._chargeStandard);

        // Express charge
        this._chargeExpress = new PopupMenu.PopupMenuItem(_('Charge Express'));
        this._chargeExpress.connect('activate', () => {
            priveledgedExec(['/opt/dell/dcc/cctk', '--PrimaryBattChargeCfg=Express']);
        });
        powerMenu.addMenuItem(this._chargeExpress);
    }

    disable() {
        this._separator.destroy();
        this._chargeCustom.destroy();
        this._chargeCustom = null;
        this._chargeStandard.destroy();
        this._chargeStandard = null;
        this._chargeExpress.destroy();
        this._chargeExpress = null;
    }
}

function init(meta) {
    return new DellCommandControlMenuExtension(meta.uuid);
}
