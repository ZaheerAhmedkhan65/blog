//routes/applicationRoutes.js
const fs = require('fs');
const path = require('path');
const authenticate = require('../middlware/authenticate');

const publicRoutes = ['auth'];

const routeMounts = {
    index: '/',
    user: '/',
    follower: '/users',
};

module.exports = (app) => {
    const routesPath = path.join(__dirname, '..', 'routes');
    const routeFiles = fs
  .readdirSync(routesPath)
        .filter(f => f.endsWith('Routes.js') && f !== 'applicationRoutes.js' && f !== 'appRoutes.js');

    routeFiles.forEach(file => {
        const route = require(path.join(routesPath, file));
        const routeName = file.replace('Routes.js', '').toLowerCase();
        const routePath = routeMounts[routeName] || `/${routeName}`;

        if (publicRoutes.includes(routeName)) {
            app.use(routePath, route);
        } else {
            app.use(routePath, authenticate, route);
        }
        console.log(`✔ Mounted ${file} → ${routePath}`);
    });
};
