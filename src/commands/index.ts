import { help } from "./help";
import { cancelmatch, splitmatch, startmatch, startsplit } from "./match";
import { reload, forcevote } from "./match/utils";
import { cancelqual, splitqual, startsplitqual, endqual } from "./quals";
import { submit } from "./submit";


export default [
    startmatch,
    startsplit,
    reload,
    forcevote,
    splitmatch,
    cancelmatch,
    submit,
    splitqual,
    help,
    startsplitqual,
    cancelqual,
    endqual
]