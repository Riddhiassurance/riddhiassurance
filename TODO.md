- [x] Restored OTP tab UI and unified login UI in `frontend/src/pages/Login.jsx` (pill switcher, active styling, clear fields on switch)
- [x] Ensured unified token storage key is `token` in the login page and removed any `5174` references
- [x] Updated backend `POST /api/auth/login` to issue admin token with `role: 'admin'` and return same error message `Invalid credentials` for wrong credentials
- [ ] Integrate unified admin dashboard route into `frontend/src/App.jsx` with non-guessable slug `/manage-portal` and role-based protection (requires adding AdminDashboard page)

- [ ] Move/import existing admin panel UI into `frontend/src/pages/AdminDashboard.jsx` and add logout clearing token and navigating to `/`
- [ ] Update any leftover frontend admin-login redirection and routing references
- [ ] Sanity check: OTP flow request-otp-login/verify-otp-login redirects for roles user/advisor/admin

