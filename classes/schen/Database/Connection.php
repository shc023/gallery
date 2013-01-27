<?php

namespace schen\Database;

class Connection
{
    /** @var \mysqli_result */
    private $queryResult = null;

    /** @var Array Used in fetchNext to detect end of fetch (to close off the result) */
    private $fetchedArray = array();

    /** @var \mysqli */
    private $mysqli = null;

    /**
     * Connect to a MySQL database to be able to use the methods below.
     * @param $database string Database identifier
     */
    function DatabaseConnection($database = 'image_buckets')
    {
        $this->mysqli = \SecureDBConnect($database);
    }

    /** Query the database.
     * @param $query string SQL query
     * @return \mysqli_result The result of the query, to use with fetchNextObject().
     */
    function query($query)
    {
        $this->queryResult = $this->mysqli->query($query);

        return $this->queryResult;
    }

    /** Do the same as query() but do not return nor store result.\n
     * Should be used for INSERT, UPDATE, DELETE...
     * @param $query string SQL query
     * @return bool
     */
    function execute($query)
    {
        return $this->mysqli->real_query($query);
    }

    /** Users can choose not to send in a parameter if they want to fetch from the last queried result
     */
    function fetchNext(\mysqli_result $result = null)
    {
        if ($result == null) {
            $result = $this->queryResult;
        }

        if ($result == null || $this->queryResult->num_rows < 1) {
            return null;
        }

        /** Purely for performance. clear memory out.
         */
        $this->fetchedArray = $result->fetch_row();

        if ($this->fetchedArray == null) {
            $result->close();
        }

        return $this->fetchedArray;
    }

    /** Users can choose not to send in a parameter if they want to see the last queried results
     */
    function numRows(\mysqli_result $result = null)
    {
        if ($result == null) {
            $result = $this->queryResult;
        }

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
