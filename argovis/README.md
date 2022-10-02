# Argovis

This repository contains the source code for Argovis's frontend, written in React. The basic architecture of these pages is as follows:

 - A set of UI elements accept search parameters from the user; when any is changed, React's state is updated to immediately show the change in the UI. This change may or may not trigger an async data refresh through React's `componentDidUpdate` built-in callback, controlled by `state.refreshData = true|false`.
 - If a data refresh is requested, all URLs to be queried are queried in parallel, and a map redraw is triggered once all are complete, if necessary.