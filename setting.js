const setting = {};

setting.WEB_PORT = process.env.WEB_PORT || 21126;
setting.REDIS_HOST = process.env.REDIS_HOST || 'ec2-***.compute.amazonaws.com';
setting.REDIS_PORT = process.env.REDIS_PORT || 6379;
setting.REDIS_AUTH = process.env.REDIS_AUTH || '***';
setting.BROADCASTER = process.env.BROADCASTER || 'broadcaster';

module.exports = setting;
