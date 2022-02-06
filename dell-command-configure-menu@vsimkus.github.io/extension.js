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

const { GObject, St, Gio, Clutter } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const constants = Me.imports.constants;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const Ornament = imports.ui.popupMenu.Ornament;
const ModalDialog = imports.ui.modalDialog;

// Modal dialog to show the output of the command
const OutputModal = GObject.registerClass(
    class OutputModal extends ModalDialog.ModalDialog {
        _init(output) {
            super._init();

            let box = new St.BoxLayout({ vertical: true});
            this.contentLayout.add(box);

            box.add(new St.Label({ text: output }));

            this.setButtons([{ label: _('Close'),
                               action: () => { this.close(global.get_current_time()); },
                               key: Clutter.Escape
                             }]);
        }
    });

const BIOSSetupPasswordModal = GObject.registerClass(
    class BIOSSetupPasswordModal extends ModalDialog.ModalDialog {
        _init(cb) {
            super._init();

            let box = new St.BoxLayout({ 
                vertical: true,
                style: 'spacing: 6px'
            });
            this.contentLayout.add(box);

            box.add(new St.Label({ text: _('Enter your BIOS Setup Password') + ':'}));
            let passwordField = St.PasswordEntry.new();

            box.add(passwordField);

            this.setButtons([
                {
                    label: _('Close'),
                    action: () => { this.close(global.get_current_time()); },
                    key: Clutter.Escape
                },
                { 
                    label: _('Ok'),
                    action: () => {
                        this.close(global.get_current_time());
                        cb(passwordField.text);
                    },
                    key: Clutter.Return
                }
            ]);

            // open the dialog to make all fields visible
            this.open(global.get_current_time());

            // to focus an element it first needs to visible
            global.stage.set_key_focus(passwordField);

            // watch for key press to close dialog on Escape or proceed on Ctrl+Return
            passwordField.connect('key-press-event', (o, e) => {
                const symbol = e.get_key_symbol();

                if (symbol === Clutter.KEY_Escape) {
                    this.close(global.get_current_time());
                } else if (symbol === Clutter.KEY_Return) {
                    this.close(global.get_current_time());
                    cb(passwordField.text);
                }
            });
            // Close dialog and proceed on Return key
            passwordField.clutter_text.connect('activate', (actor) => {
                this.close(global.get_current_time());
                cb(passwordField.text);
            });
        }
    });

// Run terminal commands as root and display output in a modal
function priviledgedExec(args, onSuccess) {
    try {
        let proc = Gio.Subprocess.new(
            ['pkexec', '--user', 'root'].concat(args),
            Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
        );

        proc.communicate_utf8_async(null, null, (proc, res) => {
            try {
                let [, stdout, stderr] = proc.communicate_utf8_finish(res);
                let dialog = null;

                // Failure
                if (!proc.get_successful()) {
                    if (stdout) {
                        dialog = new OutputModal(stdout);
                        dialog.open(global.get_current_time());
                    }
                    throw new Error(stderr);
                }

                // Success - show output in a modal
                dialog = new OutputModal(stdout);
                dialog.open(global.get_current_time());
                onSuccess();
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
    }

    execCctk(args, onSuccessCb) {
        const command = ['/opt/dell/dcc/cctk'].concat(args);

        if (this.askBIOSSetupPassword) {
            new BIOSSetupPasswordModal(function (biosSetupPassword) {
                command.push('--ValSetupPwd=' + biosSetupPassword);
                priviledgedExec(command, onSuccessCb);
            });
        } else {
            priviledgedExec(command, onSuccessCb);
        }
    }

    addCustomCharge() {
        const _this = this;
        let customChargeStart = this.settings.get_uint(constants.CUSTOM_CHARGE_START_KEY);
        let customChargeStop = this.settings.get_uint(constants.CUSTOM_CHARGE_STOP_KEY);

        this._chargeCustom = new PopupMenu.PopupMenuItem(_('Charge Custom') + `=${customChargeStart}-${customChargeStop}`);
        // Connect to settings changes
        this.chargeCustomStartChangedHandle = this.settings.connect(`changed::${constants.CUSTOM_CHARGE_START_KEY}`, () => {
            customChargeStart = this.settings.get_uint(constants.CUSTOM_CHARGE_START_KEY);
            this._chargeCustom.label.set_text(_('Charge Custom') + `=${customChargeStart}-${customChargeStop}`);
        });
        this.chargeCustomStopChangedHandle = this.settings.connect(`changed::${constants.CUSTOM_CHARGE_STOP_KEY}`, () => {
            customChargeStop = this.settings.get_uint(constants.CUSTOM_CHARGE_STOP_KEY);
            this._chargeCustom.label.set_text(_('Charge Custom') + `=${customChargeStart}-${customChargeStop}`);
        });
        this.chargeCustomHandle = this._chargeCustom.connect('activate', () => {
            // Make sure values are integers
            if (!Number.isInteger(customChargeStart) || !Number.isInteger(customChargeStop)) {
                throw new Error("Invalid limit values to custom charge config!");
            }

            this.execCctk(
                [`--PrimaryBattChargeCfg=Custom:${customChargeStart}-${customChargeStop}`],
                () => { _this.setChargeOrnament('custom');}
            );
        });

        this.popupMenuSection.addMenuItem(this._chargeCustom);
    }

    addStandardCharge() {
        const _this = this;
        this._chargeStandard = new PopupMenu.PopupMenuItem(_('Charge Standard'));
        this.chargeStandardHandle = this._chargeStandard.connect('activate', () => {
            this.execCctk(
                ['--PrimaryBattChargeCfg=Standard'],
                () => { _this.setChargeOrnament('standard');}
            );
        });
        this.popupMenuSection.addMenuItem(this._chargeStandard);
    }

    addAdaptiveCharge() {
        const _this = this;
        this._chargeAdaptive = new PopupMenu.PopupMenuItem(_('Charge Adaptive'));
        this.chargeAdaptiveHandle = this._chargeAdaptive.connect('activate', () => {
            this.execCctk(
                ['--PrimaryBattChargeCfg=Adaptive'],
                () => { _this.setChargeOrnament('adaptive');}
            );
        });
        this.popupMenuSection.addMenuItem(this._chargeAdaptive);
    }

    addExpressCharge() {
        const _this = this;
        this._chargeExpress = new PopupMenu.PopupMenuItem(_('Charge Express'));
        this.chargeExpressHandle = this._chargeExpress.connect('activate', () => {
            this.execCctk(
                ['--PrimaryBattChargeCfg=Express'],
                () => { _this.setChargeOrnament('express');}
            );
        });
        this.popupMenuSection.addMenuItem(this._chargeExpress);
    }

    destroySeparator() {
        if (this._separator) {
            this._separator.destroy();
            this._separator = null;
        }
    }
    
    destroySettings() {
        if (this.settings) {
            if (this.askBIOSSetupPasswordHandle) {
                this.settings.disconnect(this.askBIOSSetupPasswordHandle)
            }
            if (this.indicateCurrentChargeModeHandle) {
                this.settings.disconnect(this.indicateCurrentChargeModeHandle)
            }

            if (this.enableCustomChargeHandle) {
                this.settings.disconnect(this.enableCustomChargeHandle);
            }
            if (this.enableStandardChargeHandle) {
                this.settings.disconnect(this.enableStandardChargeHandle);
            }
            if (this.enableAdaptiveChargeHandle) {
                this.settings.disconnect(this.enableAdaptiveChargeHandle);
            }
            if (this.enableExpressChargeHandle) {
                this.settings.disconnect(this.enableExpressChargeHandle);
            }
        }
    }
    
    destroyCustomCharge() {
        if (this.settings) {
            if (this.chargeCustomStartChangedHandle) {
                this.settings.disconnect(this.chargeCustomStartChangedHandle);
            }
            if (this.chargeCustomStopChangedHandle) {
                this.settings.disconnect(this.chargeCustomStopChangedHandle);
            }
        }

        if (this._chargeCustom) {
            if (this.chargeCustomHandle) {
                this._chargeCustom.disconnect(this.chargeCustomHandle);
                this.chargeCustomHandle = null;
            }

            this._chargeCustom.destroy();
            this._chargeCustom = null;
        }
    }
    
    destroyStandardCharge() {
        if (this._chargeStandard) {
            if (this.chargeStandardHandle) {
                this._chargeStandard.disconnect(this.chargeStandardHandle);
                this.chargeStandardHandle = null;
            }

            this._chargeStandard.destroy();
            this._chargeStandard = null;
        }
    }
    
    destroyAdaptiveCharge() {
        if (this._chargeAdaptive) {
            if (this.chargeAdaptiveHandle) {
                this._chargeAdaptive.disconnect(this.chargeAdaptiveHandle);
                this.chargeAdaptiveHandle = null;
            }

            this._chargeAdaptive.destroy();
            this._chargeAdaptive = null;
        }
    }
    
    destroyExpressCharge() {
        if (this._chargeExpress) {
            if (this.chargeExpressHandle) {
                this._chargeExpress.disconnect(this.chargeExpressHandle);
                this.chargeExpressHandle = null;
            }

            this._chargeExpress.destroy();
            this._chargeExpress = null;
        }
    }

    setChargeOrnament(itemCode) {
        const chargeModes = {
            'custom': this._chargeCustom,
            'standard': this._chargeStandard,
            'adaptive': this._chargeAdaptive,
            'express': this._chargeExpress
        };

        // Reset ornament
        for (const [code, handle] of Object.entries(chargeModes)) {
            if (handle) {
                handle.setOrnament(Ornament.NONE);
            }
        }

        if (!this.indicateCurrentChargeMode) {
            return
        }

        // Set ornament
        if (itemCode in chargeModes) {
            chargeModes[itemCode].setOrnament(Ornament.DOT);
            this.settings.set_string(constants.CURRENT_CHARGE_MODE_KEY, itemCode);
        }
    }

    enable() {
        const powerMenu = Main.panel.statusArea.aggregateMenu._power._item.menu;

        this.settings = ExtensionUtils.getSettings(Me.metadata['settings-schema']);
        this.popupMenuSection = new PopupMenu.PopupMenuSection();
        this._separator = new PopupMenu.PopupSeparatorMenuItem();

        powerMenu.addMenuItem(this._separator);
        powerMenu.addMenuItem(this.popupMenuSection);

        // Charge mode ornament
        this.indicateCurrentChargeMode = this.settings.get_boolean(constants.INDICATE_CURRENT_CHARGE_MODE);
        this.indicateCurrentChargeModeHandle = this.settings.connect(`changed::${constants.INDICATE_CURRENT_CHARGE_MODE}`, () => {
            this.indicateCurrentChargeMode = this.settings.get_boolean(constants.INDICATE_CURRENT_CHARGE_MODE);
            if (this.indicateCurrentChargeMode) {
                let chargeMode = this.settings.get_string(constants.CURRENT_CHARGE_MODE_KEY);
                this.setChargeOrnament(chargeMode);
            } else {
                this.setChargeOrnament(null);
            }
        });

        // Requires BIOS setup password
        this.askBIOSSetupPassword = this.settings.get_boolean(constants.ASK_BIOS_SETUP_PASSWORD_KEY);
        this.askBIOSSetupPasswordHandle = this.settings.connect(`changed::${constants.ASK_BIOS_SETUP_PASSWORD_KEY}`, () => {
            this.askBIOSSetupPassword = this.settings.get_boolean(constants.ASK_BIOS_SETUP_PASSWORD_KEY);
        });

        let enableCustomCharge = this.settings.get_boolean(constants.ENABLE_CUSTOM_CHARGE_KEY);
        let enableStandardCharge = this.settings.get_boolean(constants.ENABLE_STANDARD_CHARGE_KEY);
        let enableAdaptiveCharge = this.settings.get_boolean(constants.ENABLE_ADAPTIVE_CHARGE_KEY);
        let enableExpressCharge = this.settings.get_boolean(constants.ENABLE_EXPRESS_CHARGE_KEY);

        this.enableCustomChargeHandle = this.settings.connect(`changed::${constants.ENABLE_CUSTOM_CHARGE_KEY}`, () => {
            enableCustomCharge = this.settings.get_boolean(constants.ENABLE_CUSTOM_CHARGE_KEY);

            if (enableCustomCharge) {
                this.addCustomCharge();
            } else {
                this.destroyCustomCharge();
            }
        });

        this.enableStandardChargeHandle = this.settings.connect(`changed::${constants.ENABLE_STANDARD_CHARGE_KEY}`, () => {
            enableStandardCharge = this.settings.get_boolean(constants.ENABLE_STANDARD_CHARGE_KEY);

            if (enableStandardCharge) {
                this.addStandardCharge();
            } else {
                this.destroyStandardCharge();
            }
        });

        this.enableAdaptiveChargeHandle = this.settings.connect(`changed::${constants.ENABLE_ADAPTIVE_CHARGE_KEY}`, () => {
            enableAdaptiveCharge = this.settings.get_boolean(constants.ENABLE_ADAPTIVE_CHARGE_KEY);

            if (enableAdaptiveCharge) {
                this.addAdaptiveCharge();
            } else {
                this.destroyAdaptiveCharge();
            }
        });

        this.enableExpressChargeHandle = this.settings.connect(`changed::${constants.ENABLE_EXPRESS_CHARGE_KEY}`, () => {
            enableExpressCharge = this.settings.get_boolean(constants.ENABLE_EXPRESS_CHARGE_KEY);

            if (enableExpressCharge) {
                this.addExpressCharge();
            } else {
                this.destroyExpressCharge();
            }
        });

        // custom charge
        if (enableCustomCharge) {
            this.addCustomCharge()
        }

        // Standard charge
        if (enableStandardCharge) {
            this.addStandardCharge()
        }

        // Adaptive charge
        if (enableAdaptiveCharge) {
            this.addAdaptiveCharge()
        }

        // Express charge
        if (enableExpressCharge) {
            this.addExpressCharge();
        }

        // set current charge ornament
        this.setChargeOrnament(this.settings.get_string(constants.CURRENT_CHARGE_MODE_KEY));
    }

    disable() {
        this.destroySeparator();
        this.destroySettings();
        this.destroyCustomCharge();
        this.destroyStandardCharge();
        this.destroyAdaptiveCharge();
        this.destroyExpressCharge();

        if (this.popupMenuSection) {
            this.popupMenuSection.destroy();
        }

        if (this.settings) {
            this.settings = null;
        }
    }
}

function init(meta) {
    return new DellCommandControlMenuExtension(meta.uuid);
}
