const { joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, NoSubscriberBehavior, StreamType } = require('@discordjs/voice');
const { channel } = require('diagnostics_channel');
const { Client, GatewayIntentBits, Partials, quote } = require('discord.js');
const Discord = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates], partials: [Partials.Channel] });

const possAskAnswers = ['Yes', 'Obviously', 'Not Even Close', 'Not a chance', 'Well no shit', 'Hell nah'];

client.on("ready", () => {
    console.log('Online')
});

const { Player, RepeatMode, ProgressBar, DMPError } = require('discord-music-player');
const { disconnect } = require('process');

const player = new Player(client, {
    leaveOnEmpty: true,
    leaveOnEnd: false,
    leaveOnStop: false,
    shuffle: true
});

let songChannel;
let songChannelId;

client.player = player;

let starterEmbed = new Discord.EmbedBuilder();

client.on('messageCreate', async message => {
    var guildQueue = client.player.getQueue(message.guild.id);

    let starterEmbed = new Discord.EmbedBuilder()
        .setColor('03AC13')
        .setTimestamp()

    //Making sure the Bot didn't send the message
    if (message.author != 1013615051535548498){
        //Making sure message starts with the correct prefix
        if (message.content.startsWith('!')){
            let songChannelId = message.channel.id;
            songChannel = await client.channels.fetch(songChannelId.toString());

            //List of what the user send next to the command
            const msgList = message.content.split(" ");
            //First word in the command
            const startWord = msgList[0].toString();
            //Removes the '!' from the user message
            switch (startWord.substring(1).toLowerCase()){
                case 'ask':
                    //Chooses random response from the list of possible responses
                    const askAnswer = possAskAnswers[Math.floor(Math.random(0) * possAskAnswers.length)];
                    return message.reply(`${askAnswer}`);
                case 'say':
                    const usersWhoCanUseSay = ['556611856228286466', '537775857423613982', '514635522501771296', '695513302666838057'];
                    if (usersWhoCanUseSay.includes(message.author.id)){
                        //converts the message to a string, and makes it a list split by spaces
                        let msgToSay = message.content.toString().split(' ');
                        //Removes the first item in the list of words(removes '!say')
                        msgToSay.shift();
                        message.delete();
                        return message.channel.send(`${msgToSay.join(' ')}`);
                    }else{
                        return message.channel.send('Nice Try...');
                    }
                case 'help':
                    //Creates the box that displays all of the commands
                    const helpBox = new Discord.EmbedBuilder()
                        .setTitle('Commands')
                        .setColor('#03AC13')
                        .setDescription('Shows All Current Commands')
                        .setThumbnail('https://cdn.wallpapersafari.com/92/9/t2eONd.jpg')
                        .setTimestamp()
                        .addFields(
                            { name: '!ask', value: 'Ask the bot any question', inline: false},
                            { name: '!join', value: 'Makes TreyBot join vc (must currently be in vc)' },
                            { name: '!play', value: 'Plays any song you put after this' },
                            { name: '!playlist', value: 'Plays any playlist link you put after this' },
                            { name: '!skip', value: 'Plays next thing in queue' },
                            { name: '!stop', value: 'Clears the queue and stops current song' },
                            { name: '!shuffle', value: 'Shuffles current queue' },
                            { name: '!queue', value: 'Shows the current queue (shows max of next 5 songs)' },
                            { name: '!quote', value: 'Random quote said by someone in the server'},
                            { name: '!exam', value: 'Put an exam after this and see what you got'},
                            { name: '!help', value: 'You just used this command', inline: false}
                        )
                        .setFooter({text: `${message.author.tag} Needed Some Help`})

                    return message.channel.send({embeds : [helpBox]});
                case 'join':
                    //checks if the user is in a VC
                    if (message.member.voice.channel != null){
                        //creats the voice connection, doesn't work well with the discord-music-player however
                        var voiceConnection = joinVoiceChannel({
                            channelId: message.member.voice.channel.id,
                            guildId: message.member.guild.id,
                            adapterCreator: message.member.guild.voiceAdapterCreator,
                            selfDeaf: false
                        });
                        inVc = true;
                        message.react('👍');
                        
                    } else {
                        return message.channel.send('`Must Be In A VC`');
                    }
                    break;
                case 'play':

                    if (message.author.id === "723928239361491067") return message.channel.send("No sus freestyles Ishaan...");

                    //Creates queue of songs
                    var playQueue = player.createQueue(message.guild.id);

                    try {
                        //Takes the user message and plays the song from it
                        await playQueue.join(message.member.voice.channel);
                        var psong = await playQueue.play(msgList.slice(1).toString().replace(/,/g, ' ')).catch(err => {
                            console.log(err);
                            
                            if(!guildQueue)
                                playQueue.stop();
        
                        });
                        
                        //checking if song is first in queue
                        if (!psong.isFirst) {
                            starterEmbed.addFields({ name: `Position In Queue: \`${guildQueue.songs.length - 1}\``, value: `${psong}`});
                            starterEmbed.setFooter({ text: `Added by ${message.author.tag }`});
                        } else {
                            starterEmbed.addFields({ name: `Now Playing`, value: `${psong}`});
                            starterEmbed.setFooter({ text: `Requested by ${message.author.tag }`});
                        }

                        //logging the song, might have to change method of looking up song however
                        console.log(msgList.slice(1).toString().replace(/,/g, ' '));
                        //Returns embedded message of song name and author
                        return message.channel.send({embeds : [starterEmbed]});
                    } catch {
                        return message.reply('`Must be in vc`');
                    }
                case 'playlist':
                    //Makes a queue
                    var playQueue = player.createQueue(message.guild.id);

                    try {
                        await playQueue.join(message.member.voice.channel);
                        var psong = await playQueue.playlist(msgList.slice(1).toString().replace(/,/g, ' ')).catch(err => {
                            console.log(msgList.slice(1).toString().replace(/,/g, ' '));
                            console.log(err);
                        
                            if(!guildQueue)
                                playQueue.stop();
    
                        });

                        starterEmbed.addFields({ name: `Now Playing Playlist`, value: `Name: ${psong.name}`});

                        return message.channel.send({embeds: [starterEmbed]});

                    } catch {
                        return message.channel.send(`Playlist Not Found`);
                    }
                case 'queue':
                    if (client.player.getQueue(message.guild.id)){
                        starterEmbed.setFooter({ text: `Called by ${message.author.tag}` })
                        //Limiting the embed size to 5 if the queue size is greater than 5
                        if (guildQueue.songs.length >= 5){
                            starterEmbed.addFields({ name: `Song 1 (Now Playing)`, value: `${guildQueue.songs[0]}` });
                            starterEmbed.addFields({ name: `Song 2`, value: `${guildQueue.songs[1]}` });
                            starterEmbed.addFields({ name: `Song 3`, value: `${guildQueue.songs[2]}` });
                            starterEmbed.addFields({ name: `Song 4`, value: `${guildQueue.songs[3]}` });
                            starterEmbed.addFields({ name: `Song 5`, value: `${guildQueue.songs[4]}` });

                            //If there are more then 5 songs, say how many others are in queue
                            if (guildQueue.songs.length > 5){
                                starterEmbed.addFields({ name: `And More`, value: `\`${guildQueue.songs.length - 5}\` additional songs in queue`})
                            }
                        } else if (guildQueue.songs.length > 0){
                            let i = 0;
                            starterEmbed
                            while (true) {
                                try {
                                    //If its the first song in queue add "(Now Playing)"
                                    if (i + 1 === 1){
                                        //Adding the song name and position to the embed
                                        starterEmbed.addFields({ name: `Song ${i + 1} (Now Playing)`, value: `${guildQueue.songs[i]}` });
                                    } else {
                                        starterEmbed.addFields({ name: `Song ${i + 1}`, value: `${guildQueue.songs[i]}` });
                                    }
                                    //If there are no more songs in the queue after the current one being looped over then return
                                    if (guildQueue.songs[i + 1] == null) {
                                        return message.channel.send({embeds: [starterEmbed]});
                                    }
                                    //Might not be a needed line, but always good to check for errors
                                } catch {
                                    return message.channel.send({embeds: [starterEmbed]});
                                }

                                i += 1;
                            }
                        } else {
                            return message.channel.send('`No Active Queue`');
                        }

                        return message.channel.send({embeds: [starterEmbed]});
                    } else {
                        //If their is no queue
                        return message.channel.send('`No Active Queue`');
                    }
                case 'shuffle':
                    if (client.player.getQueue(message.guild.id)) {
                        message.react(`👍`)
                        return guildQueue.shuffle();
                    } else {
                        return message.channel.send(`\`No Active Queue\``)
                    }
                case 'skip':
                    //skips current song
                    message.react('👍');
                    return guildQueue.skip();
                case 'stop':
                    //Stops current song and clears queue
                    message.react('👍');
                    return guildQueue.stop();
                case 'outro':
                    var playQueue = player.createQueue(message.guild.id);

                    try {
                        //Takes the user message and plays the song from it
                        await playQueue.join(message.member.voice.channel);
                        var psong = await playQueue.play('https://www.youtube.com/watch?v=FX9eEhoRZhY').catch(err => {
                            console.log(err);
                            
                            if(!guildQueue)
                                playQueue.stop();
        
                        });

                        return message.react('👍');
                    } catch (err){
                        return message.channel.send(`No`);
                    }
                case 'intro':
                    var playQueue = player.createQueue(message.guild.id);

                    try {
                        //Takes the user message and plays the song from it
                        await playQueue.join(message.member.voice.channel);
                        var psong = await playQueue.play('https://www.youtube.com/watch?v=jRWR0Ob6mLI').catch(err => {
                            console.log(err);
                            
                            if(!guildQueue)
                                playQueue.stop();
        
                        });

                        return message.react('👍');
                    } catch (err){
                        return message.channel.send(`No`);
                    }
                case 'exam':
                    //Takes the exam name from the user message
                    let exam = message.content.toString().split(' ').join(' ').replace('!exam', '');

                    examScore = Math.floor(Math.random(0) * 101);
                    return message.channel.send(`\`You will get a ${examScore} on your ${exam}\``)
                case 'quote':
                    const quotes = [`"Hornswoggled" - Ishaan`, `"Frolicking through a field of tulips" - Trey`, `"The best part of christmas is putting a spy cam on the christmas tree" - Nolan`, `"I poisoned them with my goo" - Trey`, `"Not bad, cya" - Jensen`, `"Little holes are trash, i want big holes" - Thomas`, `"I'M HARD" - Ishaan`, `"It's like a bagel with no hole in it, but with a bunch of holes in it" - Nolan`, `"Certified teamkiller" - Ishaan`, `"Call me the boogeyman the way I prey on these teens" - Trey`, `"This is for my homies out in the slums of Mumbai" - Ishaan`, `"NOT 21 NOT 21 NOT 21" - Ishaan`, `"ABC EFG CAUSE ONLY BLAINE TAKES THE D" - Trey`, `"I'm doing the Muslim special of blowing up my home village" - Trey"`, `"I'mma give blaine this pipe" - Ishaan`, `"This dude just flicked on my ass" - Brandon`, `"smmerhong" - Blaine`];

                    return message.channel.send(`${quotes[Math.floor(Math.random(0) * quotes.length)]}`)
                case 'kick':
                    const memberToKick = message.mentions.members.first();
                    if (!memberToKick.kickable) return message.channel.send(`Can't kick him sadly`);
                    memberToKick.kick();
                    return message.channel.send(`${memberToKick} GOODBYE BACK TO THE LOBBY`);
                default:
                    //If the command isnt't one of the set cases (commands)
                    return message.reply('Invalid Command');
            }
        }
    }else{
        return;
    }
});

client.player
    
    .on('songChanged', (queue, newSong, oldSong) => {

        let starterEmbed = new Discord.EmbedBuilder()
            .setColor('03AC13')
            .setTimestamp()
        starterEmbed.addFields(
            { name: `Now Playing`, value: `${newSong}`}
        );

        songChannel.send({ embeds: [starterEmbed]});
    })
    

client.login(myLoginKey);
