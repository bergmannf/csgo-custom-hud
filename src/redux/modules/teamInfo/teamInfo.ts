import { Action, handleActions } from "redux-actions";
import { INITIALIZE_CLIENT, SET_ROUND_PHASE, SWAP_TEAM_INFO, swapTeamInfo } from "../actions";
import { createAction } from "../../../util/createAction";
import { all, put, select, take, takeEvery, takeLatest } from "redux-saga/effects";
import { SagaIterator } from "redux-saga";
import { team1, team2, scoreFilePath } from "../../../config/teamInfo";
import { State } from "../index";
import { GameStateIntegration, GameStateIntegrationPayload } from "../../../dataTypes";
import RoundPhase = GameStateIntegration.RoundPhase;
import { SET_ROUND_WINNER } from "../roundWinner/roundWinner";
import { TeamInfo } from "../../../views/topBar/TopBar";
export const SET_TEAM_INFO = "hud/SET_TEAM_INFO";
export const setTeamInfo = createAction<TeamInfoState>(SET_TEAM_INFO);

export interface StaticTeamInfo {
    /**
     * チーム名.
     */
    name: string;
    /**
     * ロゴ.
     */
    logo: string;
}

export interface DynamicTeamInfo {
    /**
     * Rounds this team has already won in this best-of-X series.
     */
    roundsWon: number;
    /**
     * Rounds this team has to win, to win the complete best-of-X series.
     */
    roundsToWin: number;
}

export interface ScoreFile {
    roundsToWin: number;
    [key: string]: number;
}

export interface TeamInfoState {
    t: StaticTeamInfo & DynamicTeamInfo;
    ct: StaticTeamInfo & DynamicTeamInfo;
}
const initialState: TeamInfoState = {
    t: {
        name: null,
        logo: null,
        roundsWon: 0,
        roundsToWin: 0,
    },
    ct: {
        name: null,
        logo: null,
        roundsWon: 0,
        roundsToWin: 0,
    },
};

/**
 * Ugly work around to read a file from the local filesystem.
 * @param file: The path to the local file to be read.
 * @return: The contents of the file.
 */
function readTextFile(file: string): string {
    var rawFile = new XMLHttpRequest();
    var allText: string = "";
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status === 0) {
                allText = rawFile.responseText;
            }
        }
    };
    rawFile.send(null);
    return allText;
}

function getTeamScores(gsi: GameStateIntegrationPayload, teamInfo: TeamInfoState): ScoreFile {
    const scoresText: string = readTextFile(scoreFilePath);
    var teamScores: ScoreFile = null;
    if (scoresText) {
        teamScores = JSON.parse(scoresText);
    } else {
        const tTeamName = teamInfo.t.name;
        const ctTeamName = teamInfo.t.name;
        teamScores = {
            roundsToWin: gsi.map.num_matches_to_win_series,
            tTeamName: gsi.map.team_t.matches_won_this_series,
            ctTeamName: gsi.map.team_t.matches_won_this_series,
        };
    }
    return teamScores;
}

export function* runSetTeamInfoState(): SagaIterator {
    const teamInfo: TeamInfoState = {
        t: {
            name: team1.name || null,
            logo: team1.logo,
            roundsWon: 0,
            roundsToWin: 0,
        },
        ct: {
            name: team2.name || null,
            logo: team2.logo,
            roundsWon: 0,
            roundsToWin: 0,
        },
    };
    const gsiResponse: GameStateIntegrationPayload = yield select((state: State) => state.gsi);
    const teamScores = getTeamScores(gsiResponse, teamInfo);
    yield put(setTeamInfo({
        t: {
            name: team1.name || null,
            logo: team1.logo,
            roundsWon: teamScores[teamInfo.t.name],
            roundsToWin: teamScores.roundsToWin,
        },
        ct: {
            name: team2.name || null,
            logo: team2.logo,
            roundsWon: teamScores[teamInfo.t.name],
            roundsToWin: teamScores.roundsToWin,
        },
    }));
}

export function* runSetRoundWinner(): SagaIterator {
    // round winner が設定されてから round phase が切り替わるまで待つ
    yield take(SET_ROUND_PHASE);
    const roundPhase: RoundPhase = yield select((state: State) => state.roundPhase.phase);
    if (roundPhase === RoundPhase.freezetime) {
        const score = yield select((state: State) => state.score.ct + state.score.t);
        if (score === 15) {
            yield put(swapTeamInfo());
        }
    }
}
export function* runSwapTeamInfo(): SagaIterator {
    const teamInfo: TeamInfoState = yield select((state: State) => state.teamInfo);
    yield put(setTeamInfo({
        t: teamInfo.ct,
        ct: teamInfo.t,
    }));
}

export function* runReadRoundScores(): SagaIterator {
    const teamInfo: TeamInfoState = yield select((state: State) => state.teamInfo);
    const gsiResponse: GameStateIntegrationPayload = yield select((state: State) => state.gsi);
    const teamScores = getTeamScores(gsiResponse, teamInfo);
    yield put(setTeamInfo({
        t: {
            name: teamInfo.t.name,
            logo: teamInfo.t.logo,
            roundsWon: teamScores[teamInfo.t.name],
            roundsToWin: teamScores.roundsToWin,
        },
        ct: {
            name: teamInfo.ct.name,
            logo: teamInfo.ct.logo,
            roundsWon: teamScores[teamInfo.ct.name],
            roundsToWin: teamScores.roundsToWin,
        },
    }));
}

export const reducer = handleActions<TeamInfoState, any>({
    [SET_TEAM_INFO]: (state, action: Action<TeamInfoState>) => action.payload,
}, initialState);

export function* rootSaga(): SagaIterator {
    yield all([
        takeLatest(INITIALIZE_CLIENT, runSetTeamInfoState),
        takeLatest(SWAP_TEAM_INFO, runSwapTeamInfo),
        takeLatest(SET_ROUND_WINNER, runReadRoundScores),
        takeEvery(SET_ROUND_WINNER, runSetRoundWinner),
    ]);
}
