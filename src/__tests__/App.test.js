// src/routes/AppRoutes.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';

// Mock the ProtectedRoute and PublicRoute to simplify route rendering
jest.mock('./ProtectedRoute', () => ({ children }) => <>{children}</>);
jest.mock('./PublicRoute', () => ({ children }) => <>{children}</>);

// Mock pages
jest.mock('../pages/Login', () => () => <div>Login Page</div>);
jest.mock('../pages/Dashboard', () => () => <div>Dashboard Page</div>);
jest.mock('../pages/Ballot', () => () => <div>Ballot Page</div>);
jest.mock('../pages/CreateBallot', () => () => <div>Create Ballot Page</div>);

describe('AppRoutes', () => {
    test('renders Dashboard on /', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <AppRoutes />
            </MemoryRouter>
        );
        expect(screen.getByText(/Dashboard Page/i)).toBeInTheDocument();
    });

    test('renders Dashboard on /dashboard', () => {
        render(
            <MemoryRouter initialEntries={['/dashboard']}>
                <AppRoutes />
            </MemoryRouter>
        );
        expect(screen.getByText(/Dashboard Page/i)).toBeInTheDocument();
    });

    test('renders Ballot on /ballot', () => {
        render(
            <MemoryRouter initialEntries={['/ballot']}>
                <AppRoutes />
            </MemoryRouter>
        );
        expect(screen.getByText(/Ballot Page/i)).toBeInTheDocument();
    });

    test('renders Login on /login', () => {
        render(
            <MemoryRouter initialEntries={['/login']}>
                <AppRoutes />
            </MemoryRouter>
        );
        expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
    });

    
});
