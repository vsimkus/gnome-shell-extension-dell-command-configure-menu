'use strict';

const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const constants = Me.imports.constants;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

function init() {
}

function buildPrefsWidget() {

    this.settings = ExtensionUtils.getSettings(Me.metadata['settings-schema']);

    // Create a parent widget that we'll return from this function
    let prefsWidget = new Gtk.Grid({
        margin_bottom: 18,
        margin_end: 18,
        margin_start: 18,
        margin_top: 18,
        column_spacing: 12,
        row_spacing: 12,
        visible: true
    });

    let title = new Gtk.Label({
        label: `<b>${Me.metadata.name} ${_('preferences')}</b>`,
        halign: Gtk.Align.START,
        use_markup: true,
        visible: true
    });
    prefsWidget.attach(title, 0, 0, 2, 1);

    // Load settings
    let customChargeStart = this.settings.get_uint(constants.CUSTOM_CHARGE_START_KEY);
    let customChargeStop = this.settings.get_uint(constants.CUSTOM_CHARGE_STOP_KEY);
    let askBIOSSetupPassword = this.settings.get_boolean(constants.ASK_BIOS_SETUP_PASSWORD_KEY);
    let indicateCurrentChargeMode = this.settings.get_boolean(constants.INDICATE_CURRENT_CHARGE_MODE);
    
    let enableCustomCharge = this.settings.get_boolean(constants.ENABLE_CUSTOM_CHARGE_KEY);
    let enableStandardCharge = this.settings.get_boolean(constants.ENABLE_STANDARD_CHARGE_KEY);
    let enableAdaptiveCharge = this.settings.get_boolean(constants.ENABLE_ADAPTIVE_CHARGE_KEY);
    let enableExpressCharge = this.settings.get_boolean(constants.ENABLE_EXPRESS_CHARGE_KEY);

    // Ask for setup password
    let askBIOSSetupPasswordLabel = new Gtk.Label({
        label: _('Ask for BIOS Setup password') + ':',
        halign: Gtk.Align.START,
        visible: true,
        hexpand: true
    });
    prefsWidget.attach(askBIOSSetupPasswordLabel, 0, 1, 1, 1);

    let askBIOSSetupPasswordChk = Gtk.CheckButton.new();
    askBIOSSetupPasswordChk.set_visible(true);
    askBIOSSetupPasswordChk.set_active(askBIOSSetupPassword);
    prefsWidget.attach(askBIOSSetupPasswordChk, 1, 1, 1, 1);

    // Current charge mode indicator
    let indicateCurrentChargeModeLabel = new Gtk.Label({
        label: _('Indicate current charge mode') + ':',
        halign: Gtk.Align.START,
        visible: true,
        hexpand: true
    });
    prefsWidget.attach(indicateCurrentChargeModeLabel, 0, 2, 1, 1);

    let indicateCurrentChargeModeChk = Gtk.CheckButton.new();
    indicateCurrentChargeModeChk.set_visible(true);
    indicateCurrentChargeModeChk.set_active(indicateCurrentChargeMode);
    prefsWidget.attach(indicateCurrentChargeModeChk, 1, 2, 1, 1);

    let chargeIndicatorDisclaimerText = _(`Charge mode indicator will always indicate the last charge mode set via the extension. Hence, it may not always be correct, for example, if the charge setting was changed directly through BIOS settings, another tool, or when CMOS is cleared during a laptop repair.`);
    let chargeIndicatorDisclaimer = new Gtk.Label({
        label: `<i>${chargeIndicatorDisclaimerText}</i>`,
        halign: Gtk.Align.START,
        use_markup: true,
        visible: false,
        wrap: true,
        hexpand: true,
        xalign: 0.0
    });
    prefsWidget.attach(chargeIndicatorDisclaimer, 0, 3, 2, 1);

    // Charge options to display 
    // custom charge
    let enableCustomChargeLabel = new Gtk.Label({
        label: _('Enable custom charge') + ':',
        halign: Gtk.Align.START,
        visible: true,
        hexpand: true
    });
    prefsWidget.attach(enableCustomChargeLabel, 0, 4, 1, 1);

    let enableCustomChargeChk = Gtk.CheckButton.new();
    enableCustomChargeChk.set_visible(true);
    enableCustomChargeChk.set_active(enableCustomCharge);
    prefsWidget.attach(enableCustomChargeChk, 1, 4, 1, 1);

    // standard charge
    let enableStandardChargeLabel = new Gtk.Label({
        label: _('Enable standard charge') + ':',
        halign: Gtk.Align.START,
        visible: true,
        hexpand: true
    });
    prefsWidget.attach(enableStandardChargeLabel, 0, 5, 1, 1);

    let enableStandardChargeChk = Gtk.CheckButton.new();
    enableStandardChargeChk.set_visible(true);
    enableStandardChargeChk.set_active(enableStandardCharge);
    prefsWidget.attach(enableStandardChargeChk, 1, 5, 1, 1);

    // adaptive charge
    let enableAdaptiveChargeLabel = new Gtk.Label({
        label: _('Enable adaptive charge') + ':',
        halign: Gtk.Align.START,
        visible: true,
        hexpand: true
    });
    prefsWidget.attach(enableAdaptiveChargeLabel, 0, 6, 1, 1);

    let enableAdaptiveChargeChk = Gtk.CheckButton.new();
    enableAdaptiveChargeChk.set_visible(true);
    enableAdaptiveChargeChk.set_active(enableAdaptiveCharge);
    prefsWidget.attach(enableAdaptiveChargeChk, 1, 6, 1, 1);

    // express charge
    let enableExpressChargeLabel = new Gtk.Label({
        label: _('Enable express charge') + ':',
        halign: Gtk.Align.START,
        visible: true,
        hexpand: true
    });
    prefsWidget.attach(enableExpressChargeLabel, 0, 7, 1, 1);

    let enableExpressChargeChk = Gtk.CheckButton.new();
    enableExpressChargeChk.set_visible(true);
    enableExpressChargeChk.set_active(enableExpressCharge);
    prefsWidget.attach(enableExpressChargeChk, 1, 7, 1, 1);

    // custom charge thresholds
    let customChargeThresholds = new Gtk.Label({
        label: `<b>${_('Custom charge thresholds')}</b>`,
        halign: Gtk.Align.START,
        use_markup: true,
        visible: true
    });
    prefsWidget.attach(customChargeThresholds, 0, 8, 2, 1);

    // Custom charge start
    let startLabel = new Gtk.Label({
        label: _('Custom charge start') + ':',
        halign: Gtk.Align.START,
        visible: true,
        hexpand: true
    });
    prefsWidget.attach(startLabel, 0, 9, 1, 1);

    let startCharging = Gtk.SpinButton.new_with_range(
        constants.CUSTOM_CHARGE_MIN_START, 
        customChargeStop-constants.CUSTOM_CHARGE_INCREMENTS, 
        constants.CUSTOM_CHARGE_INCREMENTS);
    startCharging.set_visible(true);
    startCharging.set_value(customChargeStart);
    prefsWidget.attach(startCharging, 1, 9, 1, 1);

    // Custom charge stop
    let stopLabel = new Gtk.Label({
        label: _('Custom charge stop') + ':',
        halign: Gtk.Align.START,
        visible: true,
        hexpand: true
    });
    prefsWidget.attach(stopLabel, 0, 10, 1, 1);

    let stopCharging = Gtk.SpinButton.new_with_range(
        customChargeStart+constants.CUSTOM_CHARGE_INCREMENTS, 
        constants.CUSTOM_CHARGE_MAX_STOP, 
        constants.CUSTOM_CHARGE_INCREMENTS);
    stopCharging.set_visible(true);
    stopCharging.set_value(customChargeStop);
    prefsWidget.attach(stopCharging, 1, 10, 1, 1);

    let chargeDisclaimerPrefix = _(`NOTE: any changes to the battery charge levels will take effect after you click "`) + _('Charge Custom');
    let chargeDisclaimerSuffix = _('" again.')
    let customChargeDisclaimer = new Gtk.Label({
        label: `<i>${chargeDisclaimerPrefix}=${customChargeStart}-${customChargeStop}${chargeDisclaimerSuffix}</i>`,
        halign: Gtk.Align.START,
        use_markup: true,
        visible: false,
        wrap: true,
        hexpand: true,
        xalign: 0.0
    });
    prefsWidget.attach(customChargeDisclaimer, 0, 11, 2, 1);

    
    askBIOSSetupPasswordChk.connect('toggled', () => {
        let val = askBIOSSetupPasswordChk.get_active();
        this.settings.set_boolean(constants.ASK_BIOS_SETUP_PASSWORD_KEY, val);
    });

    indicateCurrentChargeModeChk.connect('toggled', () => {
        let val = indicateCurrentChargeModeChk.get_active();
        this.settings.set_boolean(constants.INDICATE_CURRENT_CHARGE_MODE, val);
        if (val) {
            chargeIndicatorDisclaimer.set_visible(true);
        } else {
            chargeIndicatorDisclaimer.set_visible(false);
        }
    });

    enableCustomChargeChk.connect('toggled', () => {
        let val = enableCustomChargeChk.get_active();
        this.settings.set_boolean(constants.ENABLE_CUSTOM_CHARGE_KEY, val);
    });

    enableStandardChargeChk.connect('toggled', () => {
        let val = enableStandardChargeChk.get_active();
        this.settings.set_boolean(constants.ENABLE_STANDARD_CHARGE_KEY, val);
    });

    enableAdaptiveChargeChk.connect('toggled', () => {
        let val = enableAdaptiveChargeChk.get_active();
        this.settings.set_boolean(constants.ENABLE_ADAPTIVE_CHARGE_KEY, val);
    });

    enableExpressChargeChk.connect('toggled', () => {
        let val = enableExpressChargeChk.get_active();
        this.settings.set_boolean(constants.ENABLE_EXPRESS_CHARGE_KEY, val);
    });

    // Make sure startCharging is less than stopCharging and save on change
    startCharging.connect('value_changed', () => {
        let val = startCharging.get_value_as_int();
        stopCharging.set_range(val+constants.CUSTOM_CHARGE_INCREMENTS, constants.CUSTOM_CHARGE_MAX_STOP);
        this.settings.set_uint(constants.CUSTOM_CHARGE_START_KEY, val);

        let customChargeStart = this.settings.get_uint(constants.CUSTOM_CHARGE_START_KEY);
        let customChargeStop = this.settings.get_uint(constants.CUSTOM_CHARGE_STOP_KEY);
        customChargeDisclaimer.set_label(`<i>${chargeDisclaimerPrefix}=${customChargeStart}-${customChargeStop}${chargeDisclaimerSuffix}</i>`);
        customChargeDisclaimer.set_visible(true);
    });
    stopCharging.connect('value_changed', () => {
        let val = stopCharging.get_value_as_int();
        startCharging.set_range(constants.CUSTOM_CHARGE_MIN_START, val-constants.CUSTOM_CHARGE_INCREMENTS);
        this.settings.set_uint(constants.CUSTOM_CHARGE_STOP_KEY, val);

        let customChargeStart = this.settings.get_uint(constants.CUSTOM_CHARGE_START_KEY);
        let customChargeStop = this.settings.get_uint(constants.CUSTOM_CHARGE_STOP_KEY);
        customChargeDisclaimer.set_label(`<i>${chargeDisclaimerPrefix}=${customChargeStart}-${customChargeStop}${chargeDisclaimerSuffix}</i>`);
        customChargeDisclaimer.set_visible(true);
    });

    return prefsWidget;
}

