// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useMemo} from 'react';

import {CloudUsage, Limits} from '@mattermost/types/cloud';
import {limitThresholds} from 'utils/limits';

interface MaybeLimitSummary {
    id: typeof LimitTypes[keyof typeof LimitTypes];
    limit: number | undefined;
    usage: number;
}
export interface LimitSummary {
    id: typeof LimitTypes[keyof typeof LimitTypes];
    limit: number;
    usage: number;
}

function refineToDefined(...args: MaybeLimitSummary[]): LimitSummary[] {
    return args.reduce((acc: LimitSummary[], maybeLimitType: MaybeLimitSummary) => {
        if (maybeLimitType.limit !== undefined) {
            acc.push(maybeLimitType as LimitSummary);
        }
        return acc;
    }, []);
}

export const LimitTypes = {
    messageHistory: 'messageHistory',
    fileStorage: 'fileStorage',
    enabledIntegrations: 'enabledIntegrations',
    boardsCards: 'boardsCards',
} as const;

// Hook used to tell if some limit status should be surfaced to the user
// for further attention, for example for prompting the user to upgrade
// from a free cloud instance to a paid cloud instance.
export default function useGetMultiplesExceededCloudLimit(usage: CloudUsage, limits: Limits): Array<typeof LimitTypes[keyof typeof LimitTypes]> {
    return useMemo(() => {
        if (Object.keys(limits).length === 0) {
            return [];
        }
        const maybeMessageHistoryLimit = limits.messages?.history;
        const messageHistoryUsage = usage.messages.history;

        const maybeBoardsCardsLimit = limits.boards?.cards;
        const boardsCardsUsage = usage.boards.cards;

        const maybeFileStorageLimit = limits.files?.total_storage;
        const fileStorageUsage = usage.files.totalStorage;

        const maybeEnabledIntegrationsLimit = limits.integrations?.enabled;
        const enabledIntegrationsUsage = usage.integrations.enabled;

        // Order matters for this array. The designs specify:
        // > Show the plan limit that is the highest.
        // > Otherwise if there is a tie,
        // > default to showing Message History first,
        // > File storage second,
        // > and App limit third.
        const highestLimit = refineToDefined(
            {
                id: LimitTypes.messageHistory,
                limit: maybeMessageHistoryLimit,
                usage: messageHistoryUsage,
            },
            {
                id: LimitTypes.fileStorage,
                limit: maybeFileStorageLimit,
                usage: fileStorageUsage,
            },
            {
                id: LimitTypes.enabledIntegrations,
                limit: maybeEnabledIntegrationsLimit,
                usage: enabledIntegrationsUsage,
            },
            {
                id: LimitTypes.boardsCards,
                limit: maybeBoardsCardsLimit,
                usage: boardsCardsUsage,
            },
        ).
            reduce((acc: Array<typeof LimitTypes[keyof typeof LimitTypes]>, curr: LimitSummary) => {
                if ((curr.usage / curr.limit) > (limitThresholds.exceeded / 100)) {
                    acc.push(curr.id);
                    return acc;
                }
                return acc;
            }, [] as Array<typeof LimitTypes[keyof typeof LimitTypes]>);

        return highestLimit;
    }, [usage, limits]);
}
