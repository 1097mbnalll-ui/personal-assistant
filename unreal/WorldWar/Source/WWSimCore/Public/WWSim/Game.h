// World War — strategic simulation core.
// Engine-agnostic C++17 (standard library only, no exceptions, no RTTI). The same sources build as the Unreal module
// "WWSimCore" and as a standalone library for the headless test-suite (see Tests/ and CMakeLists.txt).
// Rules are a port of the browser reference implementation (src/template.html + src/sim.js, documented in docs/GAME_SPEC.md).
//
// Design rules:
//  * No presentation here. The world is told what happened through SimEvent values (see Events below).
//  * All randomness comes from the Rng stored in the state, so a seed + a command list reproduces a game exactly.
//  * Commands validate everything and return a Result; an illegal command never changes the state.
#pragma once
#include <cstdint>
#include <functional>
#include <string>
#include <vector>

#ifndef WWSIMCORE_API
#define WWSIMCORE_API
#endif

namespace ww
{
constexpr int kNumRegions = 26;
constexpr int kMaxPlayers = 4;
constexpr int kOpsPerRound = 3;
constexpr int kNone = -1;

enum class EKingdom : uint8_t { Mountains, Ports, Desert, Plains, Neutral };
enum class ESize : uint8_t { Small, Medium, Large };
enum class EPhase : uint8_t { Admin, Cards, Move, Attack, Ended };
enum class ECard : uint8_t { None, Move, Attack, Peace };
enum class EWorldEvent : uint8_t { Fire, Theft, Plague, Waves, Treasure, Friday, Mercenaries, Sale, Supply, Riot, Duel, Harvest, Calm, Count };
enum class EWeather : uint8_t { Clear, Rain, Storm, Snow, Sand, Fog, Count };
enum class EMissile : uint8_t { Normal, Heavy };
enum class EIntelSource : uint8_t { Human, Signals, Satellite };
enum class EDetection : uint8_t { Early, Late, Missed };
enum class ETech : uint8_t { Radar, IntegratedWarning, Interceptors, CivilDefense, RocketEngines, HeavyWarheads, Guidance, Training, Doctrine, Logistics, Fortification, Crypto, Sigint, Satellite, Count };
enum class ETechBranch : uint8_t { AirDefense, Missiles, Land, Intelligence };
constexpr int kNumTech = static_cast<int>(ETech::Count);

enum class EResult : uint8_t { Ok, WrongPhase, AlreadyDone, NoOperationsLeft, NotEnoughGold, RequirementNotMet, InvalidTarget, LimitReached };

struct FRegionDef { const char* Key; const char* NameAr; EKingdom Terrain; ESize Size; bool bCapital; bool bCoastal; };
struct FTechDef { const char* Key; const char* NameAr; ETechBranch Branch; int Cost; int Rounds; uint32_t RequiresMask; int MinIndustry; int MinIntel; bool bHasTest; };

WWSIMCORE_API const FRegionDef& RegionDef(int Region);
WWSIMCORE_API const std::vector<int>& Neighbours(int Region);
WWSIMCORE_API const FTechDef& TechDef(ETech Tech);
WWSIMCORE_API int GoldMineRegion();

// ---------------------------------------------------------------------------------------------------------------
// Deterministic random numbers (splitmix64). Part of the saved state.
struct FRng
{
	uint64_t State = 0x9E3779B97F4A7C15ull;
	uint64_t Next() { uint64_t Z = (State += 0x9E3779B97F4A7C15ull); Z = (Z ^ (Z >> 30)) * 0xBF58476D1CE4E5B9ull; Z = (Z ^ (Z >> 27)) * 0x94D049BB133111EBull; return Z ^ (Z >> 31); }
	int Below(int N) { return N <= 0 ? 0 : static_cast<int>(Next() % static_cast<uint64_t>(N)); }       // 0 .. N-1
	double Unit() { return static_cast<double>(Next() >> 11) * (1.0 / 9007199254740992.0); }              // 0 .. 1
	bool Chance(double Probability) { return Unit() < Probability; }
};

// ---------------------------------------------------------------------------------------------------------------
// State
struct FRegionState { int Owner = kNone; int Troops = 0; bool bCamp = false; int Damaged = 0; };
struct FResearch { ETech Tech = ETech::Radar; int RoundsLeft = 0; int RoundsTotal = 0; bool bRetest = false; };
struct FRange { int Lo = 0; int Hi = 0; };

// One intelligence report. Numbers are estimates: a range that usually (not always) contains the truth.
struct FIntelReport
{
	int Target = kNone; int RoundCollected = 0; int RoundDelivered = 0; EIntelSource Source = EIntelSource::Human;
	int Confidence = 0; bool bVerifiedBySecondSource = false; bool bFailed = false;
	FRange Gold, Troops, MissilesNormal, MissilesHeavy, AirDefense, IntelLevel, Fuel, Stability, Industry, TechCount;
	int Readiness = kNone;              // kNone = could not be confirmed
	bool bTechListKnown = false; uint32_t TechMask = 0;
	uint32_t SuspectedProgramsMask = 0; bool bUnexplainedActivity = false;
	uint32_t PactPartnersMask = 0;
};
struct FThreat { int BorderForceEstimate = 0; int MobilisationSeen = 0; int Confidence = 0; int Level = 0; bool bPact = false; int Round = 0; };   // Level 0 ally .. 4 critical
struct FWarningEntry { int Round = 0; int Kind = 0; int From = kNone; int Region = kNone; EDetection Stage = EDetection::Missed; };                // Kind: 0 intercepted, 1 hit, 2 false alarm
struct FAttackOrder { bool bActive = false; int Target = kNone; int From[kNumRegions] = {}; int Total = 0; bool bInSupply = true; bool bNoFuel = false; };

struct FPlayer
{
	EKingdom Kingdom = EKingdom::Mountains; std::string Name; bool bAI = false; bool bAlive = true;
	int Gold = 3; int Minister = 1; int CampsBuilt = 0; int AirDefense = 0; int IntelLevel = 0;
	int MissilesNormal = 0; int MissilesHeavy = 0; bool bLaunched = false; int InterceptorsUsed = 0;
	int Palace = kNone; bool bPalaceLost = false; ECard Card = ECard::None; bool bAttacked = false;
	int OpsUsed = 0; int Reserve = 0; FAttackOrder Attack;
	// national simulation
	int Stability = 70; int Readiness = 0; int ReadinessChangedRound = 0; int Tax = 1; int Debt = 0; int Inflation = 0; int Industry = 0; int Fuel = 3;
	int TechRound[kNumTech] = {};       // 0 = not owned, otherwise the round it entered service
	std::vector<FResearch> Research;
	std::vector<FIntelReport> Dossier;  // newest first, max 5 per target
	FThreat Threat[kMaxPlayers];
	std::vector<FWarningEntry> Warnings;
	int ReputationAdjust = 0; bool bFalseAlarm = false;
	int LastIncome = 0;
	bool bDone = false;                 // finished the current phase
	bool HasTech(ETech T) const { return TechRound[static_cast<int>(T)] != 0; }
};
struct FPact { int A = 0; int B = 0; int Until = 0; };
struct FSanction { int By = 0; int Target = 0; int Until = 0; };
struct FCrisis { int A = 0; int B = 0; int Round = 0; };
struct FPactOffer { int From = 0; int To = 0; };
struct FModifier { int Id = 0; int Value = 0; };      // Id: see EModifier
enum class EModifier : int { Command, OpenGround, Doctrine, Mobilisation, SupplyCut, NoFuel, LowMorale, Weather, RoughGround, DugIn, Training, HighReadiness, CapitalFort };
struct FBattleReport { int Round = 0; int Attacker = kNone; int Defender = kNone; int Region = kNone; int AttackTroops = 0; int DefendTroops = 0; int AttackStrength = 0; int DefendStrength = 0; int Outcome = 0; int AttackLosses = 0; int DefendLosses = 0; std::vector<FModifier> AttackMods, DefendMods; }; // Outcome 0 win, 1 tie, 2 repelled
struct FIncome { int Big = 0, Mid = 0, Mine = 0, Port = 0, Peace = 0, Underdog = 0, Industry = 0, Trade = 0, Productivity = 0, Tax = 0, Upkeep = 0, Readiness = 0, Interest = 0, Sanctions = 0, Unrest = 0, Total = 0; };
struct FScore { int Regions = 0, Gold = 0, Palace = 0, Nation = 0, Total = 0; };

struct FState
{
	int Round = 1; int MaxRound = 7; EPhase Phase = EPhase::Admin; EWorldEvent WorldEvent = EWorldEvent::Calm; EWeather Weather = EWeather::Clear;
	std::vector<FPlayer> Players; FRegionState Regions[kNumRegions];
	std::vector<FPact> Pacts; std::vector<FSanction> Sanctions; std::vector<FCrisis> Crises; std::vector<FPactOffer> Offers;
	int Opinion[kMaxPlayers][kMaxPlayers] = {};      // Opinion[A][B]: how A sees B, -100 .. 100
	std::vector<FBattleReport> Battles;              // newest first, max 12
	FRng Rng;
};

// ---------------------------------------------------------------------------------------------------------------
// Events: everything the 3D world needs to react to. No text; the presentation layer owns wording and localisation.
enum class EEvent : uint8_t
{
	RoundStarted,          // Value = round
	WeatherChanged,        // Value = EWeather
	WorldEventApplied,     // Value = EWorldEvent
	PhaseChanged,          // Value = EPhase
	TroopsRecruited,       // Player, Value = count
	UnitDeployed,          // Player, Region, Value = troops now there
	CampBuilt,             // Player, Region
	ResearchStarted,       // Player, Value = ETech
	ResearchTestFailed,    // Player, Value = ETech
	ResearchCompleted,     // Player, Value = ETech            -> visible facility upgrade
	IndustryExpanded,      // Player, Value = level
	AirDefenseDeployed,    // Player, Value = level
	MissileBuilt,          // Player, Value = EMissile
	MissileLaunched,       // Player, Other = victim, Region, Value = EMissile, Value2 = EDetection   -> launch cinematic
	MissileIntercepted,    // Player = victim, Other = attacker, Region
	MissileImpact,         // Player = victim, Other = attacker, Region, Value = casualties, Value2 = 1 if buildings destroyed
	FalseAlarm,            // Player
	IntelReportReceived,   // Player, Other = target, Value = confidence, Value2 = EIntelSource   -> briefing
	IntelReportDelayed,    // Player, Other = target, Value = round it will arrive
	SpyCaught,             // Player = spying kingdom, Other = the one who caught it
	SabotageResult,        // Player, Other = target, Value = gold stolen (0 = failed and exposed)
	ThreatAssessed,        // Player, Other, Value = level 0..4
	ReadinessChanged,      // Player, Value = 0..2
	PactOffered,           // Player = from, Other = to
	PactSigned,            // Player, Other, Value = last round
	PactRejected,          // Player = from, Other = to
	PactBroken,            // Player, Other
	PactExpired,           // Player, Other
	SanctionImposed,       // Player, Other, Value = last round
	SanctionLifted,        // Player, Other
	CrisisStarted,         // Player, Other
	CrisisEnded,           // Player, Other
	CardsRevealed,
	BattleResolved,        // Player = attacker, Other = defender (kNone neutral), Region, Value = outcome, Value2 = index into State.Battles
	TerritoryCaptured,     // Player = new owner, Other = previous owner, Region
	PalaceFell,            // Player = loser, Other = conqueror, Region = new palace (kNone if eliminated)
	KingdomEliminated,     // Player
	Desertion,             // Player, Region
	IncomeSettled,         // Player, Value = net
	ForcedLoan,            // Player, Value = amount
	GameEnded              // Player = winner
};
struct FSimEvent { EEvent Type = EEvent::RoundStarted; int Player = kNone; int Other = kNone; int Region = kNone; int Value = 0; int Value2 = 0; };

struct FGameConfig { int NumPlayers = 4; bool bAI[kMaxPlayers] = { false, true, true, true }; uint64_t Seed = 1; int MaxRound = 7; };

// ---------------------------------------------------------------------------------------------------------------
class WWSIMCORE_API FGame
{
public:
	FState S;

	void NewGame(const FGameConfig& Config);
	void SetListener(std::function<void(const FSimEvent&)> InListener) { Listener = std::move(InListener); }

	// ----- queries -----
	int NumPlayers() const { return static_cast<int>(S.Players.size()); }
	std::vector<int> Alive() const;
	std::vector<int> Owned(int Player) const;
	std::vector<int> Others(int Player) const;
	int TroopsOf(int Player) const;
	bool IsPalace(int Region) const;
	int Capacity(int Region) const;
	int Movable(int Region) const;
	bool PactBetween(int A, int B) const;
	bool InCrisis(int A, int B) const;
	int SanctionsOn(int Player) const;
	int Reputation(int Player) const;
	bool InSupply(int Player, int Region) const;
	bool MustActNow(int Player) const;                 // human input expected from this kingdom in the current phase
	int OpsLeft(int Player) const;
	int PriceTroops(int Player) const; int PriceCamp(int Player) const; int PriceMinister(int Player) const;
	int PriceMissile(int Player, EMissile Type) const; int PriceIndustry(int Player) const; int PriceFuel(int Player) const;
	int PriceResearch(int Player, ETech Tech) const; int PriceAirDefense(int Player) const; int PriceIntel(int Player) const;
	EResult CanResearch(int Player, ETech Tech) const;
	int ResearchSlots(int Player) const;
	std::vector<int> PlaceTargets(int Player) const;
	std::vector<int> AttackTargets(int Player) const;
	std::vector<int> MissileTargets(int Player) const;
	int DetectionChance(int Defender, int Attacker) const;        // percent; Attacker may be kNone
	int InterceptChance(int Defender, int Attacker, bool bEarly) const;
	std::vector<FModifier> AttackModifiers(int Attacker, int Target, const FAttackOrder* Order) const;
	std::vector<FModifier> DefenceModifiers(int Defender, int Target, int DefendTroops) const;
	FIncome ForecastIncome(int Player, bool bFinal) const;
	FScore Score(int Player) const;
	int Winner() const;
	const FIntelReport* LatestReport(int Player, int Target) const;

	// ----- commands (Admin phase, one operation each unless noted) -----
	EResult BuyTroops(int Player);
	EResult PlaceTroop(int Player, int Region);        // free
	EResult AutoPlace(int Player);                     // free
	EResult BuildCamp(int Player, int Region);
	EResult UpgradeMinister(int Player);
	EResult DeployAirDefense(int Player);
	EResult BuildMissile(int Player, EMissile Type);
	EResult LaunchMissile(int Player, EMissile Type, int Region);
	EResult UpgradeIntel(int Player);
	EResult OrderIntelReport(int Player, int Target);
	EResult Sabotage(int Player, int Target);
	EResult ProposePact(int Player, int Target);
	EResult AnswerPact(int Player, int From, bool bAccept);   // free
	EResult BreakPact(int Player, int Target);
	EResult SendAid(int Player, int Target, int Gold);
	EResult SendEnvoy(int Player, int Target);
	EResult ImposeSanction(int Player, int Target);
	EResult LiftSanction(int Player, int Target);              // free
	EResult SetReadiness(int Player, int Level);
	EResult SetTax(int Player, int Level);
	EResult Borrow(int Player);
	EResult Repay(int Player);
	EResult BuildIndustry(int Player);
	EResult BuyFuel(int Player);
	EResult StartResearch(int Player, ETech Tech);
	// ----- other phases -----
	EResult ChooseCard(int Player, ECard Card);                 // Cards phase; ends the phase for that kingdom
	EResult MoveTroop(int Player, int From, int To);            // Move phase
	EResult SetAttack(int Player, int Target, const int* FromCounts);   // Attack phase; FromCounts[kNumRegions]
	EResult EndPhase(int Player);                               // Admin / Move / Attack: "I am done"

	// ----- persistence -----
	std::string Save() const;
	bool Load(const std::string& Data);
	uint64_t Hash() const;

private:
	std::function<void(const FSimEvent&)> Listener;
	void Emit(EEvent Type, int Player = kNone, int Other = kNone, int Region = kNone, int Value = 0, int Value2 = 0);
	FPlayer& P(int Player) { return S.Players[static_cast<size_t>(Player)]; }
	const FPlayer& P(int Player) const { return S.Players[static_cast<size_t>(Player)]; }
	EResult AdminGate(int Player, bool bNeedsOp) const;
	void AddOpinion(int A, int B, int Delta);
	void ClampStability(int Player, int Delta);
	int RegionLoss(int Region, int Count, bool bKeepOne);
	void ReleaseIfEmpty(int Region);
	std::vector<int> Fewest() const;
	void CheckEliminations();
	void PalaceFell(int Loser, int By);
	int ReturnTroops(int Player, const FAttackOrder& Order, int Count);
	void StartRound();
	void SimRoundStart();
	void IntelCycle(int Player);
	FIntelReport MakeReport(int Player, int Target, EIntelSource Source);
	void ApplyWorldEvent();
	void Pump();
	void Transition();
	std::vector<int> Participants() const;
	void Resolve();
	void Income();
	void Settle(int Player);
	void EndRound();
	void SignPact(int A, int B);
	void CommitAttack(int Player);
	// computer-run kingdoms
	void BotAct(int Player);
	void BotAdmin(int Player);
	ECard BotCard(int Player);
	void BotMove(int Player);
	void BotAttack(int Player);
	int BotFoe(int Player) const;
	bool BotAcceptsPact(int Bot, int From) const;
	int BotBestTarget(int Player);
	int BorderForce(int Player, int Other) const;
};
}
