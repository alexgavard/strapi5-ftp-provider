# Strapi 5 FTP Upload Provider

This is a Strapi 5 provider plugin that allows you to upload media files via FTP. For better organization, it will automatically create year and month folders inside your FTP server.

## Features

- Uploads media files to an FTP server.
- Automatically creates year and month directories for file organization:
<<<<<<< HEAD
    - **2024**
        - **01** (January)
        - **02** (February)
    - **2025**
        - **01** (January)
        - **02** (February)

- Allows you to set a custom path for organizing files on your FTP server (optional).

## Why Use an FTP Provider?

- **Simple to Set Up**: FTP is easy to configure and widely supported by most web hosts.
- **No Bandwidth Limits**: Unlike cloud services that charge based on storage and data transfer, FTP typically offers unlimited bandwidth (depending on your hosting plan).
- **Custom Domain**: You can use your own domain (e.g., `images.yourwebsite.com`) to serve media, enhancing your branding and control.
- **Cloudflare Integration**: Easily put Cloudflare in front of your FTP server to improve security, performance, and caching for faster delivery of media.

## Installation

To install this plugin in your Strapi project, run the following command:

```bash
npm install strapi5-provider-upload-ftp --save
```

## Configuration

After installing the plugin, you need to configure it in the `config/plugins.js` file. If this file doesn't already exist, create it. This file should contain the following information:

```javascript
module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'strapi5-provider-upload-ftp',
      providerOptions: {
        host: env('FTP_HOST'),
        port: env.int('FTP_PORT', 21),
        user: env('FTP_USER'),
        password: env('FTP_PASSWORD'),
        publicUrl: env('FTP_PUBLIC_URL'),
        ftp_custom_path: env('FTP_CUSTOM_PATH', ''),
        secure: env.bool('FTP_SECURE', false),
        passive: env.bool('FTP_PASSIVE', true),
      },
    },
  },
});
```

## Security Middleware Configuration

Because of Strapi's default security settings, you need to change the `contentSecurityPolicy` configuration to properly view thumbnails in the Media Library. Instead of using the `strapi::security` setting, replace it with the object below, as described in the [middleware configuration](https://docs.strapi.io/developer-docs/latest/setup-deployment-guides/configurations/required/middlewares.html#loading-order).

```js
export default [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'yourwebsite.com',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'yourwebsite.com',
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

## Environment Variables

You will also need to create a `.env` file with the following information (replace the values with your own FTP credentials):

```makefile
FTP_HOST=ftp.yourserver.com
FTP_PORT=21
FTP_USER=your-ftp-username
FTP_PASSWORD=your-ftp-password
FTP_PUBLIC_URL=https://yourwebsite.com
FTP_CUSTOM_PATH=uploads/images # Optional: Set a custom folder path
FTP_SECURE=false # Set to true if you want to use FTPS (FTP over SSL/TLS)
FTP_PASSIVE=true # Use passive mode (recommended for most firewalls)
```

## Testing
The plugin has been tested and works with Strapi v5.4.1 and Node.js v20.15.1.
