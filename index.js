const ftp = require('basic-ftp');

module.exports = {
    init(config) {
        const { host, user, password, publicUrl } = config;

        const getUploadPath = () => {
            const now = new Date();
            return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
        };

        const connectToFTP = async () => {
            const client = new ftp.Client();
            try {
                await client.access({ host, user, password });
                return client;
            } catch (error) {
                console.error('Failed to connect to FTP server:', error);
                throw error;
            }
        };

        const ensureDirectories = async (client, path) => {
            const directories = path.split('/');
            let currentPath = '';
            for (const dir of directories) {
                currentPath += `/${dir}`;
                try {
                    await client.send(`MKD ${currentPath}`);
                } catch (err) {
                    if (!err.message.includes('550')) { // Directory already exists
                        throw err;
                    }
                }
            }
        };

        return {
            async upload(file) {
                const uploadPath = getUploadPath();
                const filePath = `${file.hash}${file.ext}`;
                let client;

                try {
                    client = await connectToFTP();
                    await ensureDirectories(client, uploadPath);
                    await client.cd(uploadPath);

                    const stream = file.getStream();
                    if (!stream) throw new Error(`Missing file stream for: ${file.name}`);
                    await client.uploadFrom(stream, filePath);

                    file.url = `${publicUrl}/${uploadPath}/${filePath}`;
                } catch (error) {
                    console.error('Error during upload:', error);
                    throw error;
                } finally {
                    if (client) {
                        client.close();
                    }
                }
            },

            async uploadStream(file) {
                return this.upload(file);
            },

            async delete(file) {
                const uploadPath = getUploadPath();
                const filePath = `${file.hash}${file.ext}`;
                let client;

                try {
                    client = await connectToFTP();
                    await client.cd(uploadPath);
                    await client.remove(filePath);
                } catch (error) {
                    console.error('Error during file deletion:', error);
                    throw error;
                } finally {
                    if (client) {
                        client.close();
                    }
                }
            },
        };
    },
};