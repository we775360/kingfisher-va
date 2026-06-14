import {
  Client,
  GatewayIntentBits,
  TextChannel,
  EmbedBuilder,
} from 'discord.js'

let client: Client

const CHANNELS = {
  welcome: process.env.DISCORD_WELCOME_CHANNEL!,
  announcements: process.env.DISCORD_ANNOUNCEMENTS_CHANNEL!,
  events: process.env.DISCORD_EVENTS_CHANNEL!,
  bookings: process.env.DISCORD_BOOKINGS_CHANNEL!,
  pireps: process.env.DISCORD_PIREPS_CHANNEL!,
}

const PILOT_ROLE_ID = process.env.DISCORD_PILOT_ROLE!

export async function initializeDiscordBot() {
  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  })

  client.once('ready', () => {
    console.log(`🤖 Discord Bot Logged In As ${client.user?.tag}`)
  })

  client.on('guildMemberAdd', async (member) => {
    try {
      const role = member.guild.roles.cache.get(PILOT_ROLE_ID)

      if (role) {
        await member.roles.add(role)
      }

      const channel = client.channels.cache.get(
        CHANNELS.welcome
      ) as TextChannel

      if (!channel) return

      const embed = new EmbedBuilder()
        .setTitle('👋 Welcome To Kingfisher Virtual Airlines')
        .setDescription(
          `Welcome ${member}!\n\nRegister at:\nhttps://kingfisher-va.vercel.app`
        )
        .setTimestamp()

      await channel.send({
        embeds: [embed],
      })
    } catch (err) {
      console.error('Welcome Error:', err)
    }
  })

  await client.login(process.env.DISCORD_TOKEN)
}

async function sendEmbed(
  channelId: string,
  embed: EmbedBuilder
) {
  try {
    const channel = await client.channels.fetch(channelId)

    if (!channel || !(channel instanceof TextChannel)) return

    await channel.send({
      embeds: [embed],
    })
  } catch (err) {
    console.error(err)
  }
}

export async function sendPilotRegistered(
  pilotId: string,
  name: string,
  rank: string
) {
  const embed = new EmbedBuilder()
    .setTitle('👨‍✈️ New Pilot Registered')
    .addFields(
      { name: 'Pilot ID', value: pilotId, inline: true },
      { name: 'Name', value: name, inline: true },
      { name: 'Rank', value: rank, inline: true }
    )
    .setTimestamp()

  await sendEmbed(CHANNELS.welcome, embed)
}

export async function sendAnnouncement(
  title: string,
  content: string,
  author: string
) {
  const embed = new EmbedBuilder()
    .setTitle(`📢 ${title}`)
    .setDescription(content)
    .addFields({
      name: 'Author',
      value: author,
    })
    .setTimestamp()

  await sendEmbed(CHANNELS.announcements, embed)
}

export async function sendEventCreated(
  title: string,
  route: string,
  dep: string,
  arr: string
) {
  const embed = new EmbedBuilder()
    .setTitle('🎉 New Event')
    .addFields(
      { name: 'Title', value: title },
      { name: 'Route', value: route },
      { name: 'Departure', value: dep, inline: true },
      { name: 'Arrival', value: arr, inline: true }
    )
    .setTimestamp()

  await sendEmbed(CHANNELS.events, embed)
}

export async function sendBookingCreated(
  pilotId: string,
  pilotName: string,
  flightNumber: string,
  dep: string,
  arr: string
) {
  const embed = new EmbedBuilder()
    .setTitle('🛫 Booking Created')
    .addFields(
      { name: 'Pilot', value: `${pilotName} (${pilotId})` },
      { name: 'Flight', value: flightNumber },
      { name: 'Route', value: `${dep} → ${arr}` }
    )
    .setTimestamp()

  await sendEmbed(CHANNELS.bookings, embed)
}

export async function sendBookingCancelled(
  pilotId: string,
  pilotName: string,
  flightNumber: string
) {
  const embed = new EmbedBuilder()
    .setTitle('❌ Booking Cancelled')
    .addFields(
      { name: 'Pilot', value: `${pilotName} (${pilotId})` },
      { name: 'Flight', value: flightNumber }
    )
    .setTimestamp()

  await sendEmbed(CHANNELS.bookings, embed)
}

export async function sendPIREPSubmitted(
  pilotId: string,
  pilotName: string,
  flightNumber: string,
  dep: string,
  arr: string
) {
  const embed = new EmbedBuilder()
    .setTitle('📋 PIREP Submitted')
    .addFields(
      { name: 'Pilot', value: `${pilotName} (${pilotId})` },
      { name: 'Flight', value: flightNumber },
      { name: 'Route', value: `${dep} → ${arr}` },
      { name: 'Status', value: 'PENDING' }
    )
    .setTimestamp()

  await sendEmbed(CHANNELS.pireps, embed)
}

export async function sendPIREPApproved(
  pilotId: string,
  pilotName: string,
  flightNumber: string,
  earnings: number
) {
  const embed = new EmbedBuilder()
    .setTitle('✅ PIREP Approved')
    .addFields(
      { name: 'Pilot', value: `${pilotName} (${pilotId})` },
      { name: 'Flight', value: flightNumber },
      { name: 'Credited', value: `$${earnings}` }
    )
    .setTimestamp()

  await sendEmbed(CHANNELS.pireps, embed)
}

export async function sendPIREPRejected(
  pilotId: string,
  pilotName: string,
  flightNumber: string,
  reason?: string
) {
  const embed = new EmbedBuilder()
    .setTitle('❌ PIREP Rejected')
    .addFields(
      { name: 'Pilot', value: `${pilotName} (${pilotId})` },
      { name: 'Flight', value: flightNumber },
      { name: 'Reason', value: reason || 'No Reason Provided' }
    )
    .setTimestamp()

  await sendEmbed(CHANNELS.pireps, embed)
}