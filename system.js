import { world, system } from "@minecraft/server";
import { beforeEvents } from "@minecraft/server-admin";
import configDefault from "config.js";
import config from "config.js";

system.run(async () => {

	if (world.getDynamicProperty("config")) {
		config = JSON.parse(world.getDynamicProperty("config"));
	}

	system.beforeEvents.startup.subscribe((startupOptions) => {

		startupOptions.customCommandRegistry.registerEnum("fopb:modes", [
			"lite",
			"strict",
			"very_strict",
			"default"
		]);

		startupOptions.customCommandRegistry.registerCommand(
			{
				name: "fopb:fopbm",
				cheatsRequired: true,
				description: "ForceOP Blocker Mode Selector",
				permissionLevel: 1,
				mandatoryParameters: [
					{ name: "fopb:modes", type: "Enum" }
				]
			},
			(origin, option) => {

				if (option === "default") {
					config.mode = configDefault.mode;
				} else {
					config.mode = option;
				}

				world.setDynamicProperty("config", JSON.stringify(config));

				return { status: 0, message: `§2[§gFOPB§2]§r Check mode is now "${config.mode}"` };
			}
		);
	});
	system.runTimeout(async () => {
		console.warn(`[FOPB] proxy blocker online`);
		world.sendMessage(`§a◆ §2[§gFOPB§2]§r ForceOP Blocker System Successfully Initialized!`);
		beforeEvents.asyncPlayerJoin.subscribe((event) => {
			console.warn(`[FOPB] PlayerJoin Detected: \nName:${event.name} PID:${event.persistentId}`);
			if (event.persistentId.replaceAll(" ", "") == "") {
				console.warn(`[FOPB] LoginRefused: ${event.name} PFID:${event.persistentId}`);
				world.sendMessage(`§a◆ §2[§gFOPB§2]§r Blocked ForceOP Proxy Connection: ${event.name}`);
				event.disconnect(`[FOPB] Connection Rejected: Unexpected client data`);
				return false;
			} else if (config.force_op_blocker.mode !== "lite" && (event.name.length <= 3 || event.name.length >= 32 || /[^a-zA-Z0-9\s\-_]/.test(event.name))) {
				console.warn(`[FOPB] LoginRefused: ${event.name} PFID:${event.persistentId}`);
				world.sendMessage(`§a◆ §2[§gFOPB§2]§r Blocked ForceOP Proxy Connection: ${event.name}`);
				event.disconnect(`[FOPB] Connection Rejected: Unexpected client data`);
				return false;
			} else {
				event.allowJoin();
				return true;
			}
		});
	}, 200)
});