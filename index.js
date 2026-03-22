// index.js
require('dotenv').config(); // wczytuje zmienne z .env
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// zmienne z pliku .env
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// sprawdzenie, czy token się wczytał
if (!TOKEN) {
    console.error("❌ TOKEN nie został ustawiony w .env!");
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// komenda /unranks
const commands = [
    new SlashCommandBuilder()
        .setName('unranks')
        .setDescription('Usuwa wszystkie role')
        .addStringOption(option =>
            option.setName('tryb')
                .setDescription('Wybierz tryb')
                .setRequired(true)
                .addChoices({ name: 'all', value: 'all' })
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(cmd => cmd.toJSON());

// rejestracja komendy
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Rejestruję komendy...');
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        console.log('Komendy gotowe!');
    } catch (error) {
        console.error(error);
    }
})();

// bot ready
client.once('ready', () => {
    console.log(`Zalogowano jako ${client.user.tag}`);
});

// obsługa komendy
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'unranks') {
        const mode = interaction.options.getString('tryb');

        if (mode === 'all') {
            await interaction.reply({ content: 'Usuwam role... ⏳', ephemeral: true });

            const guild = interaction.guild;
            const members = await guild.members.fetch();

            let count = 0;

            for (const member of members.values()) {
                try {
                    if (member.id === guild.ownerId) continue;

                    const rolesToRemove = member.roles.cache
                        .filter(role => role.id !== guild.id);

                    if (rolesToRemove.size > 0) {
                        await member.roles.remove(rolesToRemove);
                        count++;
                    }
                } catch (err) {
                    console.log(`Nie można usunąć ról od ${member.user.tag}`);
                }
            }

            await interaction.followUp(`✅ Gotowe! ${count} osób straciło role.`);
        }
    }
});

client.login(TOKEN);