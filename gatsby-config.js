module.exports = {
    pathPrefix: '/Chatito',
    siteMetadata: {
        title: 'Chatito'
    },
    plugins: [
        'gatsby-plugin-typescript',
        {
            resolve: 'gatsby-plugin-page-creator',
            options: {
                path: `${__dirname}/web/pages`
            }
        },
        'gatsby-plugin-react-helmet',
        'gatsby-plugin-styled-components'
    ]
};