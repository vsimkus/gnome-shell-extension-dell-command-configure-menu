all: build install

.PHONY: build install lint

build:
	glib-compile-schemas --strict --targetdir=dell-command-configure-menu@vsimkus.github.io/schemas/ dell-command-configure-menu@vsimkus.github.io/schemas

install:
	install -d ~/.local/share/gnome-shell/extensions
	cp -a dell-command-configure-menu@vsimkus.github.io/ ~/.local/share/gnome-shell/extensions/

lint:
	eslint dell-command-configure-menu@vsimkus.github.io
