## Argovis frontend

Argovis' frontend is a basic React app.

### Build

React apps can be built in development mode for debugging, and production mode.

#### Dev build

From the root of this repo:

```
docker image build --target dev -t argovis/react:dev .
docker container run -p 3000:3000 -it -v $(pwd)/argovis/public:/react/argovis/public -v $(pwd)/argovis/src:/react/argovis/src argovis/react:dev bash
npm start
```

Visit the dev build at `localhost:3000`, and see React linter output in the terminal you started the container in. Please respect and eliminate all linter warnings. Website will automatically rebuild on code changes.

#### Production build

To go with github releases with matching tags:

```
docker image build --target prod -t argovis/react:major.minor.patch .
```

Run this alongside the full stack of Argovis containers per the deployment manifests in [https://github.com/argovis/argovis_deployment](https://github.com/argovis/argovis_deployment).