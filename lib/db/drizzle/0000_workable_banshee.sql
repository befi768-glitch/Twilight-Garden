CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"discord_id" text NOT NULL,
	"username" text NOT NULL,
	"coins" integer DEFAULT 100 NOT NULL,
	"exp" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"last_daily" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_discord_id_unique" UNIQUE("discord_id")
);
--> statement-breakpoint
CREATE TABLE "guild_plots" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" integer NOT NULL,
	"position" integer NOT NULL,
	"seed_type" text,
	"planted_by" integer,
	"planted_at" timestamp with time zone,
	"watered_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "plots" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"position" integer NOT NULL,
	"seed_type" text,
	"planted_at" timestamp with time zone,
	"watered_at" timestamp with time zone,
	"fertilized_at" timestamp with time zone,
	"harvest_count" integer DEFAULT 0 NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"item_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pets" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"happiness" integer DEFAULT 100 NOT NULL,
	"last_fed" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guild_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"contribution" integer DEFAULT 0 NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guilds" (
	"id" serial PRIMARY KEY NOT NULL,
	"discord_guild_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"bank" integer DEFAULT 0 NOT NULL,
	"exp" integer DEFAULT 0 NOT NULL,
	"owner_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "defenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"type" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"durability" integer DEFAULT 100 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raids" (
	"id" serial PRIMARY KEY NOT NULL,
	"attacker_id" integer NOT NULL,
	"defender_id" integer NOT NULL,
	"success" boolean NOT NULL,
	"loot" integer DEFAULT 0 NOT NULL,
	"loot_items" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auctions" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"item_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"start_price" integer NOT NULL,
	"current_price" integer NOT NULL,
	"buyer_id" integer,
	"ends_at" timestamp with time zone NOT NULL,
	"sold" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_quests" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"quest_id" text NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"claimed_at" timestamp with time zone,
	"date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weather_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"weather" text NOT NULL,
	"season" text NOT NULL,
	CONSTRAINT "weather_log_date_unique" UNIQUE("date")
);
--> statement-breakpoint
ALTER TABLE "plots" ADD CONSTRAINT "plots_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_members" ADD CONSTRAINT "guild_members_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_members" ADD CONSTRAINT "guild_members_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guilds" ADD CONSTRAINT "guilds_owner_id_players_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defenses" ADD CONSTRAINT "defenses_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raids" ADD CONSTRAINT "raids_attacker_id_players_id_fk" FOREIGN KEY ("attacker_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raids" ADD CONSTRAINT "raids_defender_id_players_id_fk" FOREIGN KEY ("defender_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_seller_id_players_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_buyer_id_players_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_quests" ADD CONSTRAINT "player_quests_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;