module.exports = {
    aws_table_name: process.env.TABLE_NAME,
    aws_remote_config: {
         accessKeyId: process.env.ACCESS_KEY,
         secretAccessKey: process.env.SECRET_ACCESS_KEY,
         region: process.env.REGION,
    }
};