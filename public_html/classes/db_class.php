<?
require_once("db_connect.php");
class DatabaseConnection
{
    var $queryResult;

    /** Used in fetchNext to detect end of fetch (to close off the result)
     */
    var $fetchedArray;

    var $mysqli;

    /** Connect to a MySQL database to be able to use the methods below.
     */
    function DatabaseConnection($database='image_buckets')
    {
        $this->queryResult = NULL;
        $this->fetchedArray = array();
        $this->mysqli = SecureDBConnect($database);

    }

    /** Query the database.
     * @param $query The query.
     * @param $debug If true, it output the query and the resulting table.
     * @return The result of the query, to use with fetchNextObject().
     */
    function query($query)
    {
        $this->queryResult = $this->mysqli->query($query);

        return $this->queryResult;
    }

    /** Do the same as query() but do not return nor store result.\n
     * Should be used for INSERT, UPDATE, DELETE...
     * @param $query The query.
     * @param $debug If true, it output the query and the resulting table.
     */
    function execute($query)
    {
        return $this->mysqli->real_query($query);
    }

    /** Users can choose not to send in a parameter if they want to fetch from the last queried result
     */
    function fetchNext($result = NULL)
    {
        if ($result == NULL)
            $result = $this->queryResult;

        if ($result == NULL || $this->queryResult->num_rows < 1)
            return NULL;

        /** Purely for performance. clear memory out.
         */
        $this->fetchedArray =  $result->fetch_row();

        if ($this->fetchedArray == NULL)
            $result->close();

        return $this->fetchedArray;
    }

    /** Users can choose not to send in a parameter if they want to see the last queried results
     */
    function numRows($result = NULL)
    {
        if ($result == NULL)
            $result = $this->queryResult;

        return $result->num_rows;
    }

    function lastInsertedId()
    {
        return $this->mysqli->insert_id;
    }

    function close()
    {
        $this->mysqli->close();
    }
}
?>