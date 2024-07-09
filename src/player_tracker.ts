import Maid from "@rbxts/maid";
import { Players, Workspace } from "@rbxts/services";
import { GetReturnType, FunctionTools, InstancePropertiesList, InstanceTools } from "@rbxts/tool_pack";

export type PlayerTracker = GetReturnType<typeof PlayersTracker.GetLocalTracker>;

export namespace PlayersTracker {
  class PlayerTracker {
    private player_: Player;
    private maid_: Maid = new Maid();
    private is_dead_ = true;
    IsDead() {
      return this.is_dead_;
    }

    private died_event_: BindableEvent = FunctionTools.Execute(() => {
      const event = new Instance("BindableEvent");
      this.maid_.GiveTask(event);
      return event;
    })
    readonly on_died: RBXScriptSignal = this.died_event_.Event;

    private spawned_event_: BindableEvent = FunctionTools.Execute(() => {
      const event = new Instance("BindableEvent");
      this.maid_.GiveTask(event);
      return event;
    })
    readonly on_spawned: RBXScriptSignal = this.spawned_event_.Event;

    private character_?: Character;
    //used to destroy the previos one if something went wrong;
    private temp_character_?: Character;
    private initialize_promise_?: Promise<void>;
    constructor(player: Player) {
      this.player_ = player;
      //intializes the character if exist
      const character = this.player_.Character;
      if (character !== undefined) this.OnCharacterAdded(character);

      this.maid_.GiveTask(this.player_.CharacterAdded.Connect(model => this.OnCharacterAdded(model)));
      this.maid_.GiveTask(this.player_.CharacterRemoving.Connect(model => this.OnCharacterRemoving(model)));
    }

    private OnCharacterAdded(model: Model) {
      //clears previous if exist;
      this.ClearTemp(true);

      this.temp_character_ = new Character(model, this);
      this.initialize_promise_ = this.temp_character_.Initialize();
    }

    private OnCharacterRemoving(model: Model) {
      this.ClearTemp(true);

      this.character_?.Destroy();
      this.character_ = undefined;
    }

    private WaitTilCharacterWillAppear(can_be_dead: boolean = false) {
      if (this.character_ !== undefined) {
        //if dead and can be dead and character exist, dont wait;
        if (this.IsDead() && can_be_dead) return;
        //dont wait if character is alive
        if (!this.IsDead()) return;
      }
      //waits til the character will tell that it's alive
      this.on_spawned.Wait();
    }

    async AwaitHumanoid(can_be_dead: boolean = false) {
      this.WaitTilCharacterWillAppear(can_be_dead);
      return this.GetHumanoid()!;
    }

    async AwaitRootPart(can_be_dead: boolean = false) {
      this.WaitTilCharacterWillAppear(can_be_dead);
      return this.GetRootPart()!;
    }

    async AwaitAnimator(can_be_dead: boolean = false) {
      this.WaitTilCharacterWillAppear(can_be_dead);
      return this.GetAnimator()!;
    }

    async AwaitAndLoadAnimation(animation: Animation, properties?: InstancePropertiesList<AnimationTrack>, can_be_dead: boolean = false) {
      this.WaitTilCharacterWillAppear(can_be_dead);
      //loads the animation and assigns the properties;
      return this.TryLoadAnimation(animation, properties)!;
    }

    async AwaitCharacter(can_be_dead: boolean = false) {
      this.WaitTilCharacterWillAppear(can_be_dead);
      return this.GetCharacter()!;
    }

    GetCharacter(): Model | undefined {
      return this.character_?.GetModel();
    }

    GetHumanoid(): Humanoid | undefined {
      return this.character_?.GetHumanoid();
    }

    GetRootPart(): BasePart | undefined {
      return this.character_?.GetRootPart();
    }

    GetAnimator(): Animator | undefined {
      return this.character_?.GetAnimator();
    }

    TryLoadAnimation(animation: Animation, properties?: InstancePropertiesList<AnimationTrack>): AnimationTrack | undefined {
      const animator = this.GetAnimator();
      if (animator === undefined) return;
      const animation_track = animator.LoadAnimation(animation);
      //assigns the properties
      if (properties !== undefined) {
        InstanceTools.AsignProperties(animation_track, properties);
      }

      return animation_track;
    }

    private ClearTemp(destroy: boolean = false) {
      if (destroy) {
        this.temp_character_?.Destroy();
        this.initialize_promise_?.cancel();
      }

      this.temp_character_ = undefined;
      this.initialize_promise_ = undefined;
    }

    /**called from character class to set itself after initialisation
     * @hidden
     */
    SetCharacter(character: Character) {
      //clears the temp;
      this.ClearTemp();
      this.character_ = character;
    }

    /**sets died status and fires the according event spawned / died;
     * @hidden */
    DiedStatusSet(value: boolean) {
      if (this.is_dead_ === value) return;
      this.is_dead_ = value;
      //fires died event if dead
      if (value) {
        //fires itself
        this.died_event_.Fire();
      } else {
        //fires when spawned
        //fires itself
        this.spawned_event_.Fire();
      }
    }

    /**@hidden */
    Destroy() {
      this.maid_.DoCleaning();
      this.maid_.Destroy();
    }
  }

  class Character {
    private model_: Model;
    GetModel() { return this.model_; }

    private humanoid_!: Humanoid;
    GetHumanoid() {
      if (this.humanoid_ !== undefined) return this.humanoid_;

      this.humanoid_ = <Humanoid>this.model_.WaitForChild("Humanoid");
      return this.humanoid_;
    }

    private animator_!: Animator;
    GetAnimator() {
      if (this.animator_ !== undefined) return this.animator_;

      this.animator_ = <Animator>this.GetHumanoid().WaitForChild("Animator");
      return this.animator_;
    }

    private root_part_!: BasePart;
    GetRootPart() {
      if (this.root_part_ !== undefined) return this.root_part_;

      this.root_part_ = <BasePart>this.model_.WaitForChild("HumanoidRootPart");
      return this.root_part_;
    }

    private maid_: Maid = new Maid();

    private player_tracker_refference_: PlayerTracker;
    constructor(model: Model, player_tracker_refference: PlayerTracker) {
      this.player_tracker_refference_ = player_tracker_refference;
      this.model_ = model;

      this.maid_.GiveTask(() => {
        //makes player dead
        this.player_tracker_refference_.DiedStatusSet(true);
      })
    }

    /**tries to initialize, async in case if didnt initialized in time to cancel     */
    async Initialize() {
      //wait til the character will be on the workspace;
      while (this.model_.Parent !== Workspace) wait();
      this.humanoid_ = <Humanoid>this.model_.WaitForChild("Humanoid");

      this.maid_.GiveTask(this.humanoid_.HealthChanged.Connect((health) => this.OnHealthChanged(health)));
      //waits with 30 fps delay to load everything;
      task.wait(1 / 30);
      this.player_tracker_refference_.SetCharacter(this);
      this.player_tracker_refference_.DiedStatusSet(false);
    }

    private OnHealthChanged(health: number) {
      if (health > 0) return;
      this.OnDied();
    }

    private OnDied() {
      this.player_tracker_refference_.DiedStatusSet(true);
    }

    /**called when the player is removing */
    Destroy() {
      this.maid_.DoCleaning();
      this.maid_.Destroy();
    }
  }

  const player_list = new Map<Player, PlayerTracker>();
  function OnPlayerAdded(player: Player) {
    player_list.set(player, new PlayerTracker(player));
  }
  function OnPlayerRemoving(player: Player) {
    //destoroys the player
    player_list.get(player)?.Destroy();
  }

  const players = Players.GetPlayers();
  players.forEach(player => OnPlayerAdded(player));

  Players.PlayerAdded.Connect(OnPlayerAdded);
  Players.PlayerRemoving.Connect(OnPlayerRemoving);

  export function GetTracker(player: Player) {
    return player_list.get(player);
  }

  export async function AwaitTracker(player: Player) {
    while (GetTracker(player) === undefined) task.wait();
    return GetTracker(player)!;
  }

  export function GetLocalTracker() {
    return player_list.get(Players.LocalPlayer)!;
  }
} 