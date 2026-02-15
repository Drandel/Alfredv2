import { SlashCommandBuilder } from 'discord.js';

const responses = [
  "David's mass is currently fluctuating between 2 and 3 planets.",
  "David is mass.",
  "I last saw David mass in the gym... wait, no, that was a forklift.",
  "David's gravitational pull just attracted a small moon.",
  "David is currently 87% mass and 13% vibes.",
  "David has been declared a natural landmark due to sheer mass.",
  "Scientists are studying David. The mass is unprecedented.",
  "David walked into a room and the floor filed a complaint.",
  "David's mass has its own zip code.",
  "David is doing great! His mass, however, is doing even greater.",
  "David sneezed and caused a 2.5 on the Richter scale.",
  "David's belt just filed for workers' comp.",
  "NASA called. They want to classify David as a celestial body.",
  "David is fine. The chair he sat on? Not so much.",
  "David's gravitational field is interfering with local Wi-Fi signals.",

  // Depressed David
  "David just sighed so hard he blew a fuse... emotionally and literally.",
  "David is staring at a wall again. The wall is winning.",
  "David's therapist just referred him to another therapist. That therapist quit.",
  "David listened to one sad song and now he's written a 47-page journal entry.",
  "David's serotonin left him on read.",
  "David googled 'why am I like this' for the 4th time today.",
  "David is lying on the floor. Not for any reason. Just floor time.",
  "David's will to live is currently at 2 bars. Like his phone. And his social life.",

  // Music David
  "David just dropped a mixtape. The fire department has been called.",
  "David is in the studio. By studio I mean his bathroom with the echo.",
  "David made a beat so hard it tripped the circuit breaker. Again.",
  "David's SoundCloud just hit 3 listeners. Two are bots. One is his mom.",
  "David is producing music. His neighbors are producing noise complaints.",
  "David just freestyled for 10 minutes straight. Not a single bar landed.",
  "David sampled a microwave beep and somehow it slaps.",
  "David's album is called 'Electrician by Day, Producer by Delusion'.",

  // Electrician David
  "David wired a light switch today. The lights now control the toaster.",
  "David got shocked at work again. He says it 'builds character'.",
  "David just told a client 'it's not a bug, it's a feature' about a sparking outlet.",
  "David connected live and neutral backwards. The house is now haunted.",
  "David's coworkers call him 'Short Circuit'. Not affectionately.",
  "David fixed someone's wiring and now their doorbell flushes the toilet.",
  "David forgot to turn off the breaker again. His hair is doing a thing.",
  "David used electrical tape to fix something that definitely needed more than electrical tape.",

  // War Thunder David
  "David just got shot down 14 seconds into a War Thunder match. New personal best.",
  "David is playing War Thunder. His K/D ratio is a war crime.",
  "David just teamkilled someone in War Thunder and blamed 'lag'.",
  "David spent 6 hours grinding War Thunder and somehow went down a rank.",
  "David's War Thunder strategy is 'fly directly at the enemy and hope'.",
  "David rage-quit War Thunder. He'll be back in 4 minutes.",
  "David just crashed into the runway on takeoff. The enemy team didn't even have to try.",
  "David's War Thunder stats are classified. For his own protection.",
  "David brought a biplane to a jet fight. Confidence is not his issue.",
  "David just spent $40 on a premium War Thunder vehicle and still can't get a kill.",
];

export default {
  data: new SlashCommandBuilder()
    .setName('howisdavidtoday')
    .setDescription('Check in on how David is doing'),
  async execute(interaction) {
    const response = responses[Math.floor(Math.random() * responses.length)];
    await interaction.reply(response);
  },
};
