import { help } from "./help";
import { cancelmatch, endmatch, splitmatch, startmatch, startsplit } from "./match";
import { reload, forcevote } from "./match/utils";
import { cancelqual, splitqual, startsplitqual, endqual } from "./quals";
import { qualsubmit, submit } from "./submit";


export default [
    startmatch,
    startsplit,
    endmatch,
    reload,
    forcevote,
    splitmatch,
    cancelmatch,
    submit,
    qualsubmit,
    splitqual,
    help,
    startsplitqual,
    cancelqual,
    endqual
].sort(function keyOrder(k1, k2) {
    if (k1.name < k2.name) return -1;
    else if (k1.name > k2.name) return 1;
    else return 0;
})