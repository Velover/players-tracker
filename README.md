package [npm](https://www.npmjs.com/package/@rbxts/players-tracker)

```bash
npm i @rbxts/players-tracker
```

# Players Tracker

Tracker of player's character.

Handle getting humanoid / root_part / character / animator from one place

## Getting the Tracker

### Player Tracker

```ts
const player_tracker: PlayerTracker | undefined =
	PlayersTracker.GetTracker(player);
const player_tracker: Promise<PlayerTracker> =
	PlayersTracker.AwaitTracker(player);
```

### Local Player Tracker

```ts
/**@client*/
const local_player_tracker: PlayerTracker = PlayersTracker.GetLocalTracker();
```

## Getting items

### can_be_dead

```ts
/**
 * if can_be_dead is false and the character is dead, will await respawn and will return the new Humanoid
 * defaults to true
 *
 * [if the character is dead his parts still exist for some time til the character removal]
 */
const can_be_dead: boolean = true;
```

### Humanoid

```ts
const humanoid: Humanoid | undefined = player_tracker.GetHumanoid();
const humanoid: Promise<Humanoid> = player_tracker.AwaitHumanoid(can_be_dead);
```

### RootPart

```ts
const root_part: BasePart | undefined = player_tracker.GetRootPart();
const root_part: Promise<BasePart> = player_tracker.AwaitRootPart(can_be_dead);
```

### Animator

```ts
const animator: Animator | undefined = player_tracker.GetAnimator();
const animator: Promise<Animator> = player_tracker.AwaitAnimator(can_be_dead);
```

### Character

```ts
const character: Model | undefined = player_tracker.GetCharacter();
const character: Promise<Model> = player_tracker.AwaitCharacter(can_be_dead);
```

## Loading Animation

```ts
const animation_track: AnimationTrack | undefined =
	player_tracker.TryLoadAnimation(animation, {
		Priority: Enum.AnimationPriority.Action,
		Looped: true,
	});
const animation_track: Promise<AnimationTrack> =
	player_tracker.AwaitAndLoadAnimation(animation, {
		Looped: true,
	});
```

## Events

### OnDied

```ts
player_tracker.OnDied.Connect(() => {});
```

### OnSpawned

```ts
player_tracker.OnSpawned.Connect(() => {});
```

## Functions

### IsDead

```ts
const is_dead = player_tracker.IsDead();
```
