const ftp = require('basic-ftp');

module.exports = {
    init(config) {
        const { host, user, password, publicUrl, ftp_custom_path } = config;

        const getUploadPath = (file) => {
            const fileDate = new Date(file.createdAt || Date.now());
            const yearMonthPath = `${fileDate.getFullYear()}/${String(fileDate.getMonth() + 1).padStart(2, '0')}`;

            if (ftp_custom_path && ftp_custom_path.trim() !== '') {
                return `${ftp_custom_path}/${yearMonthPath}`;
            } else {
                return yearMonthPath;
            }
        };

        const connectToFTP = async () => {
            const client = new ftp.Client();
            try {
                await client.access({ host, user, password });
                return client;
            } catch (error) {
                throw new Error(`Failed to connect to FTP server: ${error.message}`);
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
                    if (!err.message.includes('550')) {
                        throw err;
                    }
                }
            }
        };

        return {
            async upload(file) {
                const uploadPath = getUploadPath(file);
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
                    throw new Error(`Error during file upload: ${error.message}`);
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
                const uploadPath = getUploadPath(file);
                const filePathBase = file.hash + file.ext;
                const sizes = ['thumbnail', 'small', 'medium', 'large'];

                let client;

                try {
                    client = await connectToFTP();
                    await client.cd(uploadPath);
                    for (const size of sizes) {
                        const filePath = `${size}_${filePathBase}`;
                        try {
                            await client.remove(filePath);
                        } catch (error) {
                        }
                    }
                } catch (error) {
                    throw new Error(`Error during file deletion: ${error.message}`);
                } finally {
                    if (client) {
                        client.close();
                    }
                }
            },
        };
    },
};
