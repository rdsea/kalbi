#!/usr/bin/env bash

# for file in ../../experiments/giau_emulated_data/*
for file in ../../giau/tests/data/emulated_data/performance-eval/*

do
	echo 'Pushing file to giau' + '\n'

	curl --header "Content-Type: application/json" \
  		--request POST \
  		--data @$file \
  		http://localhost:9000/api/v1/experiment

done
