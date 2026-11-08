/**
 * Kigumo TVC Web Portal - Root Startup File for Phusion Passenger / cPanel
 *
 * This file delegates to server/index.js so that Passenger correctly launches
 * the application regardless of whether the startup file is set to index.js or app.js.
 */

require('./server/index.js');

