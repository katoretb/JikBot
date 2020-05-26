const Discord = require("discord.js");
const { prefix, token } = require("./config.json");
const ytdl = require("ytdl-core");

const client = new Discord.Client();

const queue = new Map();

client.once("ready", () => {
  console.log("---------------------------------------");
  console.log("|    Welcome to littleBear console    |");
  console.log("|    this is console of littleBear    |");
  console.log("| this is only for show status of bot |");
  console.log("|        <--Maker credit-->           |");
  console.log("|          KatoreTV#5571              |");
  console.log("---------------------------------------");
  client.user.setStatus('Online');
  client.user.setActivity('//help เพื่อดูคำสั่ง');
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${prefix}play`)) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}p`)) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}help`)) {
    message.channel.send('กุช่วยอะไรมึงไม่ได้หรอก 5555');
    message.channel.send('ถ้าต้องการความช่วยเหลือพิมพ์ //ทำไรได้ นะ');
  } else if (message.content.startsWith(`${prefix}info`)) {
    message.channel.send('สวัสดีจร้า');
    message.channel.send('ข้าคือบอทที่ถูก kato สร้างขึ้นมา');
    message.channel.send('เพื่อให้ความบันเทิง');
  } else if (message.content.startsWith(`${prefix}หมีน้อย`)) {
    message.channel.send('ว่าไงจ้า');
  } else if (message.content.startsWith(`${prefix}สวัสดี`)) {
    message.channel.send('หมีน้อยยินดีรับใช้จร้า');
  } else if (message.content.startsWith(`${prefix}ทำไรได้`)) {
    message.channel.send('หมีน้อยสามารถเปิดเพลงให้ได้จร้า');
    message.channel.send('ใช้งานหมีน้อยพิมพ์ //play แล้วตามด้วย link เพลงนะ');
    message.channel.send('หมีน้อยไม่สามารถค้นหาได้ด้วยตัวเองช่วยเอามาเป็น link ให้หน่อยนะ');
    message.channel.send('และผู้ใช้งานสามารถ //skip หรือ //stop ก็ได้นะ');
  } else if (message.content.startsWith(`${prefix}credit`)) {
    message.channel.send("-------------------------------------------------");
    message.channel.send("|--------Thank for using littleBear bot-------|");
    message.channel.send("|---This bot is made for Bear community---|");
    message.channel.send("|-you can using this bot if not for business-|");
    message.channel.send("|-----------<--Maker credit-->---------------|");
    message.channel.send("|------------<KatoreTV#5571>--------------|");
    message.channel.send("-------------------------------------------------");
  } else {
    message.channel.send("ไม่พบคำสั่งนั้นจร้า");
  }
});

async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "เข้าไปห้องคุยแบบเสียงก่อนสิเดียวหมีน้อยเปิดเพลงให้"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "หมีน้อยไม่มีสิทธิเข้าห้องรนั้นอะ"
    );
  }

  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
    title: songInfo.title,
    url: songInfo.video_url
  };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`${song.title} ได้ถูกเพิ่มไปในคิวต่อไปแล้ว`);
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "อยู่ในห้องที่เปิดเพลงก่อนนะแล้วค่อยข้ามเพลง"
    );
  if (!serverQueue)
    return message.channel.send("เพลงหมดแล้วไม่มีให้ฟังต่อแล้ว");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "อยู่ในห้องที่เปิดเพลงก่อนนะแล้วค่อยหยุดเพลง"
    );
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`หมีน้อยกำลังเล่นเพลง: **${song.title}**`);
}

client.login(token);