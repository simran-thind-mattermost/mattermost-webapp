// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators, Dispatch, ActionCreatorsMapObject} from 'redux';

import {ActionFunc, GenericAction} from '@mattermost/redux/types/actions';
import {Audit} from '@mattermost/redux/types/audits';
import {getAudits} from '@mattermost/redux/actions/admin';
import * as Selectors from '@mattermost/redux/selectors/entities/admin';
import {getLicense} from '@mattermost/redux/selectors/entities/general';

import {GlobalState} from 'types/store';

import Audits from './audits';

type Actions = {
    getAudits: () => Promise<{data: Audit[]}>;
}

function mapStateToProps(state: GlobalState) {
    const license = getLicense(state);
    const isLicensed = license.Compliance === 'true';

    return {
        isLicensed,
        audits: Object.values(Selectors.getAudits(state)),
    };
}

function mapDispatchToProps(dispatch: Dispatch<GenericAction>) {
    return {
        actions: bindActionCreators<ActionCreatorsMapObject<ActionFunc>, Actions>({
            getAudits,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Audits);
