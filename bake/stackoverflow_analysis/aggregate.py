# export GOOGLE_APPLICATION_CREDENTIALS=/path_to_google_credentials/credentials.json

from google.cloud import bigquery
client = bigquery.Client()

datasets = {
	'survey_results_public_2019': {
		'file': 'data/survey_results_public_2019.csv',
		'dataset_id': 'stack_overflow_survery',
		'table_id': 'survey_2019',
	}
}

for dataset_key in datasets:
	dataset = datasets[dataset_key]

	dataset_ref = client.dataset(dataset['dataset_id'])
	table_ref = dataset_ref.table(dataset['table_id'])
	job_config = bigquery.LoadJobConfig()
	job_config.source_format = bigquery.SourceFormat.CSV
	job_config.skip_leading_rows = 1
	job_config.autodetect = True

	with open(dataset['file'], "rb") as source_file:
	    job = client.load_table_from_file(
	    	source_file, table_ref, job_config=job_config
	    )

	job.result()  # Waits for table load to complete.

	print("Loaded {} rows into {}:{}.".format(
		job.output_rows, 
		dataset['dataset_id'], 
		dataset['table_id']
	))