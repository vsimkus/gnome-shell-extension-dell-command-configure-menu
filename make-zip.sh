#!/bin/sh

rm -f dell-command-configure-menu@vsimkus.github.io.zip
glib-compile-schemas --strict --targetdir=dell-command-configure-menu@vsimkus.github.io/schemas/ dell-command-configure-menu@vsimkus.github.io/schemas
cd dell-command-configure-menu@vsimkus.github.io && zip -r ../dell-command-configure-menu@vsimkus.github.io.zip ./* --exclude \*.po --exclude \*.gschema.xml
