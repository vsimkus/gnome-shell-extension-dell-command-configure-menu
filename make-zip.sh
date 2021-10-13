#!/bin/sh

rm -f dell-command-configure-menu@vsimkus.zip
glib-compile-schemas --strict --targetdir=dell-command-configure-menu@vsimkus/schemas/ dell-command-configure-menu@vsimkus/schemas
cd dell-command-configure-menu@vsimkus && zip -r ../dell-command-configure-menu@vsimkus.zip ./* --exclude \*.po --exclude \*.gschema.xml
