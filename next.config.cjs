// next.config.js or next.config.cjs

module.exports = {
    images: {
        domains: ['ec2-13-49-190-97.eu-north-1.compute.amazonaws.com'],
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'ec2-13-49-190-97.eu-north-1.compute.amazonaws.com',
                port: '8081',
                pathname: '/visit/images/**',
            },
        ],
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = { fs: false };
        }

        // Add a rule to include transpilation of specific node_modules
        config.module.rules.push({
            test: /\.m?js$/,
            include: /node_modules\/rc-util\/es/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env'],
                    plugins: ['@babel/plugin-transform-runtime'],
                },
            },
        });

        return config;
    },
};