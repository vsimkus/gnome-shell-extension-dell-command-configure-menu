'use strict';

const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const CUSTOM_CHARGE_MIN_START = 50;
// const CUSTOM_CHARGE_MAX_START = 95;
// const CUSTOM_CHARGE_MIN_STOP = 55;
const CUSTOM_CHARGE_MAX_STOP = 100;
const CUSTOM_CHARGE_INCREMENTS = 5;

const CUSTOM_CHARGE_START_KEY = 'custom-charge-start-charging';
const CUSTOM_CHARGE_STOP_KEY = 'custom-charge-stop-charging';
const ASK_SETUP_PASSWORD_KEY = 'ask-setup-password';
const ENABLE_CUSTOM_CHARGE_KEY = 'enable-custom-charge';
const ENABLE_STANDARD_CHARGE_KEY = 'enable-standard-charge';
const ENABLE_ADAPTIVE_CHARGE_KEY = 'enable-adaptive-charge';
const ENABLE_EXPRESS_CHARGE_KEY = 'enable-express-charge';

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
        label: `<b>${Me.metadata.name} ${_('Preferences')}</b>`,
        halign: Gtk.Align.START,
        use_markup: true,
        visible: true
    });
    prefsWidget.attach(title, 0, 0, 2, 1);

    // Load custom charge settings values
    let customChargeStart = this.settings.get_uint(CUSTOM_CHARGE_START_KEY);
    let customChargeStop = this.settings.get_uint(CUSTOM_CHARGE_STOP_KEY);
    let askSetupPassword = this.settings.get_boolean(ASK_SETUP_PASSWORD_KEY);
    let enableCustomCharge = this.settings.get_boolean(ENABLE_CUSTOM_CHARGE_KEY);
    let enableStandardCharge = this.settings.get_boolean(ENABLE_STANDARD_CHARGE_KEY);
    let enableAdaptiveCharge = this.settings.get_boolean(ENABLE_ADAPTIVE_CHARGE_KEY);
    let enableExpressCharge = this.settings.get_boolean(ENABLE_EXPRESS_CHARGE_KEY);


    // Ask for setup password
    let askSetupPasswordLabel = new Gtk.Label({
        label: _('Ask for Setup password') + ':',
        halign: Gtk.Align.START,
        visible: true,
        hexpand: true
    });
    prefsWidget.attach(askSetupPasswordLabel, 0, 1, 1, 1);

    let askSetupPasswordChk = Gtk.CheckButton.new();

    askSetupPasswordChk.set_visible(true);
    askSetupPasswordChk.set_active(askSetupPassword);
    prefsWidget.attach(askSetupPasswordChk, 1, 1, 1, 1);


    // Charge options to display
    // custom charge
    let enableCustomChargeLabel = new Gtk.Label({
        label: _('Enable custom charge') + ':',
        halign: Gtk.Align.START,
        visible: true,
        hexpand: true
    });
    prefsWidget.attach(enableCustomChargeLabel, 0, 2, 1, 1);

    let enableCustomChargeChk = Gtk.CheckButton.new();

    enableCustomChargeChk.set_visible(true);
    enableCustomChargeChk.set_active(enableCustomCharge);
    prefsWidget.attach(enableCustomChargeChk, 1, 2, 1, 1);

    // standard charge
    let enableStandardChargeLabel = new Gtk.Label({
        label: _('Enable standard charge') + ':',
        halign: Gtk.Align.START,
        visible: true,
        hexpand: true
    });
    prefsWidget.attach(enableStandardChargeLabel, 0, 3, 1, 1);

    let enableStandardChargeChk = Gtk.CheckButton.new();

    enableStandardChargeChk.set_visible(true);
    enableStandardChargeChk.set_active(enableStandardCharge);
    prefsWidget.attach(enableStandardChargeChk, 1, 3, 1, 1);

    // adaptive charge
    let enableAdaptiveChargeLabel = new Gtk.Label({
        label: _('Enable adaptive charge') + ':',
        halign: Gtk.Align.START,
        visible: true,
        hexpand: true
    });
    prefsWidget.attach(enableAdaptiveChargeLabel, 0, 4, 1, 1);

    let enableAdaptiveChargeChk = Gtk.CheckButton.new();

    enableAdaptiveChargeChk.set_visible(true);
    enableAdaptiveChargeChk.set_active(enableAdaptiveCharge);
    prefsWidget.attach(enableAdaptiveChargeChk, 1, 4, 1, 1);

    // express charge
    let enableExpressChargeLabel = new Gtk.Label({
        label: _('Enable express charge') + ':',
        halign: Gtk.Align.START,
        visible: true,
        hexpand: true
    });
    prefsWidget.attach(enableExpressChargeLabel, 0, 5, 1, 1);

    let enableExpressChargeChk = Gtk.CheckButton.new();

    enableExpressChargeChk.set_visible(true);
    enableExpressChargeChk.set_active(enableExpressCharge);
    prefsWidget.attach(enableExpressChargeChk, 1, 5, 1, 1);

    // custom charge thresholds
    let customChargeThresholds = new Gtk.Label({
        label: `<b>${_('Custom charge thresholds')}</b>`,
        halign: Gtk.Align.START,
        use_markup: true,
        visible: true
    });
    prefsWidget.attach(customChargeThresholds, 0, 6, 2, 1);

    // Custom charge start
    let startLabel = new Gtk.Label({
        label: _('Custom start charge') + ':',
        halign: Gtk.Align.START,
        visible: true,
        hexpand: true
    });
    prefsWidget.attach(startLabel, 0, 7, 1, 1);

    let startCharging = Gtk.SpinButton.new_with_range(
        CUSTOM_CHARGE_MIN_START, 
        customChargeStop-CUSTOM_CHARGE_INCREMENTS, 
        CUSTOM_CHARGE_INCREMENTS);
    startCharging.set_visible(true);
    startCharging.set_value(customChargeStart);
    prefsWidget.attach(startCharging, 1, 7, 1, 1);

    // Custom charge stop
    let stopLabel = new Gtk.Label({
        label: _('Custom stop charge') + ':',
        halign: Gtk.Align.START,
        visible: true,
        hexpand: true
    });
    prefsWidget.attach(stopLabel, 0, 8, 1, 1);

    let stopCharging = Gtk.SpinButton.new_with_range(
        customChargeStart+CUSTOM_CHARGE_INCREMENTS, 
        CUSTOM_CHARGE_MAX_STOP, 
        CUSTOM_CHARGE_INCREMENTS);
    stopCharging.set_visible(true);
    stopCharging.set_value(customChargeStop);
    prefsWidget.attach(stopCharging, 1, 8, 1, 1);

    let chargeDisclaimerPrefix = _(`NOTE: any changes to the battery charge levels will take effect after you click "`) + _('Charge Custom');
    let chargeDisclaimerSuffix = _('" again.')
    let disclaimer = new Gtk.Label({
        label: `<i>${chargeDisclaimerPrefix}=${customChargeStart}-${customChargeStop}${chargeDisclaimerSuffix}</i>`,
        halign: Gtk.Align.START,
        use_markup: true,
        visible: false,
        wrap: true,
        hexpand: true,
        xalign: 0.0
    });
    prefsWidget.attach(disclaimer, 0, 9, 2, 2);

    // Make sure startCharging is less than stopCharging
    // and save on change
    askSetupPasswordChk.connect('toggled', () => {
        let val = askSetupPasswordChk.get_active();
        this.settings.set_boolean(ASK_SETUP_PASSWORD_KEY, val);
    });

    enableCustomChargeChk.connect('toggled', () => {
        let val = enableCustomChargeChk.get_active();
        this.settings.set_boolean(ENABLE_CUSTOM_CHARGE_KEY, val);
    });

    enableStandardChargeChk.connect('toggled', () => {
        let val = enableStandardChargeChk.get_active();
        this.settings.set_boolean(ENABLE_STANDARD_CHARGE_KEY, val);
    });

    enableAdaptiveChargeChk.connect('toggled', () => {
        let val = enableAdaptiveChargeChk.get_active();
        this.settings.set_boolean(ENABLE_ADAPTIVE_CHARGE_KEY, val);
    });

    enableExpressChargeChk.connect('toggled', () => {
        let val = enableExpressChargeChk.get_active();
        this.settings.set_boolean(ENABLE_EXPRESS_CHARGE_KEY, val);
    });

    startCharging.connect('value_changed', () => {
        let val = startCharging.get_value_as_int();
        stopCharging.set_range(val+CUSTOM_CHARGE_INCREMENTS, CUSTOM_CHARGE_MAX_STOP);
        this.settings.set_uint(CUSTOM_CHARGE_START_KEY, val);

        let customChargeStart = this.settings.get_uint(CUSTOM_CHARGE_START_KEY);
        let customChargeStop = this.settings.get_uint(CUSTOM_CHARGE_STOP_KEY);
        disclaimer.set_label(`<i>${chargeDisclaimerPrefix}=${customChargeStart}-${customChargeStop}${chargeDisclaimerSuffix}</i>`);
        disclaimer.set_visible(true);
    });
    stopCharging.connect('value_changed', () => {
        let val = stopCharging.get_value_as_int();
        startCharging.set_range(CUSTOM_CHARGE_MIN_START, val-CUSTOM_CHARGE_INCREMENTS);
        this.settings.set_uint(CUSTOM_CHARGE_STOP_KEY, val);

        let customChargeStart = this.settings.get_uint(CUSTOM_CHARGE_START_KEY);
        let customChargeStop = this.settings.get_uint(CUSTOM_CHARGE_STOP_KEY);
        disclaimer.set_label(`<i>${chargeDisclaimerPrefix}=${customChargeStart}-${customChargeStop}${chargeDisclaimerSuffix}</i>`);
        disclaimer.set_visible(true);
    });

    return prefsWidget;
}

