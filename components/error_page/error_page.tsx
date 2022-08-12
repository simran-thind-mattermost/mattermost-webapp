// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {FormattedMessage} from 'react-intl';
import {Link} from 'react-router-dom';

import {ErrorPageTypes, Constants} from 'utils/constants';
import WarningIcon from 'components/widgets/icons/fa_warning_icon';

import ErrorTitle from './error_title';
import ErrorMessage from './error_message';

type Location = {
    search: string;
}

type Props = {
    location: Location;
    asymmetricSigningPublicKey?: string;
    siteName?: string;
    isGuest?: boolean;
}

interface State {
    trustParams?: boolean;
}

export default class ErrorPage extends React.PureComponent<Props, State> {

    public componentDidMount() {
        document.body.setAttribute('class', 'sticky error');
        // let enc = new TextEncoder();
        // return enc.encode('message');

        const params: URLSearchParams = new URLSearchParams(this.props.location.search);
        const signature = params.get('s');
        if (signature) {
            params.delete('s');

            if (window.crypto.subtle) {
                //const key = this.props.asymmetricSigningPublicKey;
                //const keyPEM = '-----BEGIN PUBLIC KEY-----\n' + key + '\n-----END PUBLIC KEY-----';
                const theKey = {
                    algorithm: {
                        name: 'pem',
                    },
                    extractable: false,
                    type: 'public' as any,
                    usages: [],
                }
                window.crypto.subtle.verify('sha256', theKey, signature as any, new TextEncoder().encode('/error?' + params.toString())).then((trustParams: boolean) => {
                    this.setState({trustParams});
                });
            }
        }
    }

    public componentWillUnmount() {
        document.body.removeAttribute('class');
    }

    public render() {
        const {isGuest} = this.props;
        const params: URLSearchParams = new URLSearchParams(this.props.location.search);

        const type = params.get('type');
        const title = (this.state.trustParams && params.get('title')) || '';
        const message = (this.state.trustParams && params.get('message')) || '';
        const service = (this.state.trustParams && params.get('service')) || '';
        const returnTo = (this.state.trustParams && params.get('returnTo')) || '';

        let backButton;
        if (type === ErrorPageTypes.PERMALINK_NOT_FOUND && returnTo) {
            backButton = (
                <Link to={returnTo}>
                    <FormattedMessage
                        id='error.generic.link'
                        defaultMessage='Back to Mattermost'
                    />
                </Link>
            );
        } else if (type === ErrorPageTypes.TEAM_NOT_FOUND) {
            backButton = (
                <Link to='/'>
                    <FormattedMessage
                        id='error.generic.link'
                        defaultMessage='Back to {siteName}'
                        values={{
                            siteName: this.props.siteName,
                        }}
                    />
                </Link>
            );
        } else if (type === ErrorPageTypes.CHANNEL_NOT_FOUND && isGuest) {
            backButton = (
                <Link to='/'>
                    <FormattedMessage
                        id='error.channelNotFound.guest_link'
                        defaultMessage='Back'
                    />
                </Link>
            );
        } else if (type === ErrorPageTypes.CHANNEL_NOT_FOUND) {
            backButton = (
                <Link to={params.get('returnTo') as string}>
                    <FormattedMessage
                        id='error.channelNotFound.link'
                        defaultMessage='Back to {defaultChannelName}'
                        values={{
                            defaultChannelName: Constants.DEFAULT_CHANNEL_UI_NAME,
                        }}
                    />
                </Link>
            );
        } else if (type === ErrorPageTypes.OAUTH_ACCESS_DENIED || type === ErrorPageTypes.OAUTH_MISSING_CODE) {
            backButton = (
                <Link to='/'>
                    <FormattedMessage
                        id='error.generic.link_login'
                        defaultMessage='Back to Login Page'
                    />
                </Link>
            );
        } else if (type === ErrorPageTypes.OAUTH_INVALID_PARAM || type === ErrorPageTypes.OAUTH_INVALID_REDIRECT_URL) {
            backButton = null;
        } else {
            backButton = (
                <Link to='/'>
                    <FormattedMessage
                        id='error.generic.link'
                        defaultMessage='Back to {siteName}'
                        values={{
                            siteName: this.props.siteName,
                        }}
                    />
                </Link>
            );
        }

        const errorPage = (
            <div className='container-fluid'>
                <div className='error__container'>
                    <div className='error__icon'>
                        <WarningIcon/>
                    </div>
                    <h2 data-testid='errorMessageTitle'>
                        <ErrorTitle
                            type={type}
                            title={title}
                        />
                    </h2>
                    <ErrorMessage
                        type={type}
                        message={message}
                        service={service}
                        isGuest={isGuest}
                    />
                    {backButton}
                </div>
            </div>
        );

        return (
            <>
                {errorPage}
            </>
        );
    }
}
