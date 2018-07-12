import * as React from "react";
import { BaseComponent } from "../util/baseComponent";
const classNames = require("./series_counter.scss");

/**
 * Properties to display the current status of a series.
 * A series referes to BO3/BO5 set of matches.
 */
export interface SeriesCounterProps {
    /**
     * Maximum number of matches in this series.
    */
    toWinMatches: number;
    /**
     * Number of rounds won by the CT team.
     */
    wonMatches: number;
    /**
     * Team for which the data is provided: "CT" or "T"
     */
    team: string;
}

export class SeriesCounter extends BaseComponent<SeriesCounterProps, {}> {
    render() {
        const openMatches = this.props.toWinMatches - this.props.wonMatches;
        if (this.props.wonMatches) {
            var wonDiv = [...Array(this.props.wonMatches).keys()].map(n =>
                <div key={n + "-dot-won-" + this.props.team}
                    className={classNames.seriesDot}
                    data-team={this.props.team}
                    data-won="true">
                </div>,
            );
        }
        if (openMatches) {
            var openDiv = [...Array(openMatches).keys()].map(n =>
                <div key={n + "-dot-" + this.props.team}
                    className={classNames.seriesDot}
                    data-team={this.props.team}
                    data-won="false">
                </div>,
            );
        }
        return (
            <div className={classNames.seriesCounter} data-team={this.props.team}>
                {openDiv}
                {wonDiv}
            </div>
        );
    }
}
