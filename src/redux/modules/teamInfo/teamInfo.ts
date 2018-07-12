import { Action, handleActions } from "redux-actions";
import { INITIALIZE_CLIENT, SET_ROUND_PHASE, SWAP_TEAM_INFO, swapTeamInfo } from "../actions";
import { createAction } from "../../../util/createAction";
import { all, put, select, take, takeEvery, takeLatest } from "redux-saga/effects";
import { SagaIterator } from "redux-saga";
import { team1, team2 } from "../../../config/teamInfo";
import { State } from "../index";
import { GameStateIntegration, GameStateIntegrationResponse } from "../../../dataTypes";
import RoundPhase = GameStateIntegration.RoundPhase;
import { SET_ROUND_WINNER } from "../roundWinner/roundWinner";
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

export function* runSetTeamInfoState(): SagaIterator {
    const gsiResponse: GameStateIntegrationResponse = yield select((state: State) => state.gsi);
    yield put(setTeamInfo({
        t: {
            name: team1.name || null,
            logo: team1.logo,
            roundsWon: gsiResponse.map.team_t.matches_won_this_series,
            roundsToWin: gsiResponse.map.num_matches_to_win_series,
        },
        ct: {
            name: team2.name || null,
            logo: team2.logo,
            roundsWon: gsiResponse.map.team_ct.matches_won_this_series,
            roundsToWin: gsiResponse.map.num_matches_to_win_series,
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

export const reducer = handleActions<TeamInfoState, any>({
    [SET_TEAM_INFO]: (state, action: Action<TeamInfoState>) => action.payload,
}, initialState);

export function* rootSaga(): SagaIterator {
    yield all([
        takeLatest(INITIALIZE_CLIENT, runSetTeamInfoState),
        takeLatest(SWAP_TEAM_INFO, runSwapTeamInfo),
        takeEvery(SET_ROUND_WINNER, runSetRoundWinner),
    ]);
}
