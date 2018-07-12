import { StaticTeamInfo } from "../redux/modules/teamInfo/teamInfo";
import * as path from "path";

export const scoreFilePath = path.join(__dirname, "../../teamScores.json");


// 最初はTサイドとして表示される
// 必要に応じてショートカットでチーム情報をスワップして調整する.
export const team1: StaticTeamInfo = {
    /**
     * チーム名.
     * 空の場合は、`COUNTER TERRORIST` か `TERRORIST` が表示される
     */
    name: "teamOne",
    /**
     * チームロゴ画像のファイル名.
     * ファイルは /src/resources/teams 内にいれること.
     * @example foo.png
     */
    logo: "",
};
// 最初はCTサイドとして表示される
// 必要に応じてショートカットでチーム情報をスワップして調整する.
export const team2: StaticTeamInfo = {
    /**
     * チーム名.
     * 空の場合は、`COUNTER TERRORIST` か `TERRORIST` が表示される
     */
    name: "teamTwo",
    /**
     * チームロゴ画像のファイル名.
     * 省略した場合は表示されない.
     * ファイルは /src/resources/teams 内にいれること.
     * @example foo.png
     */
    logo: "",
};
