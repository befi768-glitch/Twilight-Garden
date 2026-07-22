import {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  Message,
} from 'discord.js';

export interface Command {
  name: string;
  execute(message: Message, args: string[]): Promise<void>;
}

export class TwilightClient extends Client {
  public commands: Collection<string, Command> = new Collection();

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Message, Partials.Channel],
    });
  }
}
