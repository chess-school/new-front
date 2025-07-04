import React from 'react';
import { AuthForm } from './auth-form';
import './styles.scss';

export const AuthPage: React.FC = () => {
    return (
        <div className="auth-page">
            <AuthForm />
        </div>
    )
}
