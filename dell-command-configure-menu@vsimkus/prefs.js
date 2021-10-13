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

function init() {
}

function buildPrefsWidget() {

    this.settings = ExtensionUtils.getSettings(Me.metadata['settings-schema']);

    // Create a parent widget that we'll return from this function
    let prefsWidget = new Gtk.Grid({
        margin: 18,
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

    // Custom charge start
    let startLabel = new Gtk.Label({
        label: _('Custom start charge') + ':',
        halign: Gtk.Align.START,
        visible: true
    });
    prefsWidget.attach(startLabel, 0, 1, 1, 1);

    let startCharging = Gtk.SpinButton.new_with_range(
        CUSTOM_CHARGE_MIN_START, 
        customChargeStop-CUSTOM_CHARGE_INCREMENTS, 
        CUSTOM_CHARGE_INCREMENTS);
    startCharging.set_visible(true);
    startCharging.set_value(customChargeStart);
    prefsWidget.attach(startCharging, 1, 1, 1, 1);

    // Custom charge stop
    let stopLabel = new Gtk.Label({
        label: _('Custom stop charge') + ':',
        halign: Gtk.Align.START,
        visible: true
    });
    prefsWidget.attach(stopLabel, 0, 2, 1, 1);

    let stopCharging = Gtk.SpinButton.new_with_range(
        customChargeStart+CUSTOM_CHARGE_INCREMENTS, 
        CUSTOM_CHARGE_MAX_STOP, 
        CUSTOM_CHARGE_INCREMENTS);
    stopCharging.set_visible(true);
    stopCharging.set_value(customChargeStop);
    prefsWidget.attach(stopCharging, 1, 2, 1, 1);

    // Make sure startCharging is less than stopCharging
    // and save on change
    startCharging.connect('value_changed', () => {
        let val = startCharging.get_value_as_int();
        stopCharging.set_range(val+CUSTOM_CHARGE_INCREMENTS, CUSTOM_CHARGE_MAX_STOP);
        this.settings.set_uint(CUSTOM_CHARGE_START_KEY, val);
    });
    stopCharging.connect('value_changed', () => {
        let val = stopCharging.get_value_as_int();
        startCharging.set_range(CUSTOM_CHARGE_MIN_START, val-CUSTOM_CHARGE_INCREMENTS);
        this.settings.set_uint(CUSTOM_CHARGE_STOP_KEY, val);
    });

    return prefsWidget;
}
