const setting = {};

setting.WEB_PORT = process.env.WEB_PORT || 5000;
setting.REDIS_HOST = process.env.REDIS_HOST || 'ec2-3-112-231-92.ap-northeast-1.compute.amazonaws.com';
setting.REDIS_PORT = process.env.REDIS_PORT || 6379;
setting.REDIS_AUTH = process.env.REDIS_AUTH || '***';

module.exports = setting;
