## Development

To replicate the data in BigQuery, we need:
- Python 3.x
- Google Python SDK
- prepare BigQuery `dataset=stack_overflow_survery` and `table=survey_2019` as place holder
- extract `data.zip` to get the csv
- google API credentials to connect to BigQuery via CLI

Lastly, execute:

```
export GOOGLE_APPLICATION_CREDENTIALS=/path_to_google_credentials/credentials.json \
python aggregate.py
```


## Working data sources and reports

### BigQuery dataset 

https://console.cloud.google.com/bigquery?project=thesis-271215&p=thesis-271215&d=stack_overflow_survery&t=survey_2019&page=table


### Data sources

The following data sources are built by custom queries in BigQuery.

1. DevType based on all respondents

```
WITH CalculatedDevType AS (
  SELECT SPLIT(DevType, ';') AS raw_dt
  FROM `thesis-271215.stack_overflow_survery.survey_2019`
)
SELECT dt, COUNT(dt) As dt_quantity
FROM CalculatedDevType
CROSS JOIN UNNEST(CalculatedDevType.raw_dt) as dt
GROUP BY dt
ORDER BY 2 desc
```

Link: https://datastudio.google.com/datasources/4404b8bd-4bf8-42e4-9cff-0c42c482eab9

2. DevType based on respondents that interested in blockchain

```
WITH CalculatedDevType AS (
  SELECT SPLIT(DevType, ';') AS raw_dt
  FROM `thesis-271215.stack_overflow_survery.survey_2019`
  WHERE BlockchainIs in (
    'Useful across many domains and could change many aspects of our lives',
    'Useful for immutable record keeping outside of currency',
    'Useful across many domains and could change many aspects of our lives',
    'Useful for decentralized currency (i.e., Bitcoin)'
  )
)
SELECT dt, COUNT(dt) AS dt_quantity
FROM CalculatedDevType
CROSS JOIN UNNEST(CalculatedDevType.raw_dt) as dt
GROUP BY dt
ORDER BY 2 desc
```

Link: https://datastudio.google.com/datasources/4f763b4e-e2e8-489f-8a73-172870cb0500

3. DevType based on respondents from blockchain companies

```
WITH CalculatedDevType AS (
  SELECT SPLIT(DevType, ';') AS raw_dt
  FROM `thesis-271215.stack_overflow_survery.survey_2019`
  WHERE BlockchainOrg in (
    'Non-currency applications of blockchain',
    'Implementing cryptocurrency-based products',
    'Accepting Bitcoin or other coins and tokens as payments',
    'Implementing our own cryptocurrency'
  )
)
SELECT dt, COUNT(dt) As dt_quantity
FROM CalculatedDevType
CROSS JOIN UNNEST(CalculatedDevType.raw_dt) as dt
GROUP BY dt
ORDER BY 2 desc
```

Link: https://datastudio.google.com/datasources/21b1bfcb-eea2-43c9-9da6-e5bbf850da5a

4. Unnested Platform data source

```
WITH CalculatedPlatformWorkedWith AS (
  SELECT SPLIT(PlatformWorkedWith, ';') AS raw_dt,
  		BlockchainOrg
  FROM `thesis-271215.stack_overflow_survery.survey_2019`
)
SELECT dt, COUNT(dt) AS dt_quantity, BlockchainOrg
FROM CalculatedPlatformWorkedWith
CROSS JOIN UNNEST(CalculatedPlatformWorkedWith.raw_dt) as dt
GROUP BY 1, 3
ORDER BY 2 desc
```

Link: https://datastudio.google.com/datasources/eb8bea64-3314-476f-9746-d6fe8791518a

5. Unnested Language data source

```
WITH CalculatedLanguageWorkedWith AS (
  SELECT SPLIT(LanguageWorkedWith, ';') AS raw_dt,
  		BlockchainOrg,
  		ConvertedComp
  FROM `thesis-271215.stack_overflow_survery.survey_2019`
)
SELECT dt, COUNT(dt) AS dt_quantity, BlockchainOrg, ConvertedComp
FROM CalculatedLanguageWorkedWith
CROSS JOIN UNNEST(CalculatedLanguageWorkedWith.raw_dt) as dt
GROUP BY 1, 3, 4
ORDER BY 2 desc
```

Link: https://datastudio.google.com/datasources/0a710eac-da45-4708-8c07-8fd6848b06d0

6. Unnested Devlopment environment data source

```
WITH CalculatedDevEnviron AS (
  SELECT SPLIT(DevEnviron, ';') AS raw_dt,
  		BlockchainOrg
  FROM `thesis-271215.stack_overflow_survery.survey_2019`
)
SELECT dt, COUNT(dt) AS dt_quantity, BlockchainOrg
FROM CalculatedDevEnviron
CROSS JOIN UNNEST(CalculatedDevEnviron.raw_dt) as dt
GROUP BY 1,3
ORDER BY 2 desc
```

Link: https://datastudio.google.com/datasources/dfb029e6-2cda-406f-8852-e715fecb1302

### Analytics

Analytic reports:
- https://datastudio.google.com/reporting/89c96d55-20b3-4fdc-883c-fb2003112aab shows the overview of the report
- https://datastudio.google.com/reporting/ce796317-f918-4c69-8c9f-be59ef542c7b shows the detailed of the above report per different categories 
