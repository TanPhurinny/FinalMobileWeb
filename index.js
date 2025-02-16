const RB = ReactBootstrap;
const { Alert, Card, Button, Table, Image } = ReactBootstrap;

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAsEANU9p5dXhUIgITl-k5W3Wzh4K-7wfM",
  authDomain: "finalmobileweb.firebaseapp.com",
  projectId: "finalmobileweb",
  storageBucket: "finalmobileweb.firebasestorage.app",
  messagingSenderId: "763318502667",
  appId: "1:763318502667:web:8aa0a7f919c3df79be0e0e",
  measurementId: "G-LSNZG1BMNT"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

class App extends React.Component {
  state = {
    user: null
  };

  componentDidMount() {
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.setState({ user });
      } else {
        this.setState({ user: null });
      }
    });
  }

  signInWithGoogle = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
    } catch (error) {
      console.error("Google Sign-in Error:", error);
    }
  };

  signOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Sign-out Error:", error);
    }
  };

  render() {
    return (
      <Card>
        <Card.Header>
          <Alert variant="info">
            <b>Test Login and Logout(google) kub </b>
          </Alert>
        </Card.Header>

        <Card.Body className="text-center">
          {this.state.user ? (
            <>
              <Image
                src={this.state.user.photoURL}
                roundedCircle
                width="100"
                height="100"
              />
              <h4 className="mt-2">{this.state.user.displayName}</h4>
              <p>{this.state.user.email}</p>
              <Button variant="danger" onClick={this.signOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={this.signInWithGoogle}>
              Sign in with Google
            </Button>
          )}
        </Card.Body>

        <Card.Footer className="text-center">
          College of Computing, Khon Kaen University
        </Card.Footer>
      </Card>
    );
  }
}

const container = document.getElementById("myapp");
const root = ReactDOM.createRoot(container);
root.render(<App />);
