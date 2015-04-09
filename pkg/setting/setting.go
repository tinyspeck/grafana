// Copyright 2014 Unknwon
// Copyright 2014 Torkel Ödegaard

package setting

import (
	"bytes"
	"fmt"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"

	"github.com/macaron-contrib/session"
	"gopkg.in/ini.v1"

	"github.com/grafana/grafana/pkg/log"
)

type Scheme string

const (
	HTTP  Scheme = "http"
	HTTPS Scheme = "https"
)

const (
	DEV  string = "development"
	PROD string = "production"
	TEST string = "test"
)

var (
	// App settings.
	Env       string = DEV
	AppName   string
	AppUrl    string
	AppSubUrl string

	// build
	BuildVersion string
	BuildCommit  string
	BuildStamp   int64

	// Paths
	LogsPath string
	HomePath string
	DataPath string

	// Log settings.
	LogModes   []string
	LogConfigs []string

	// Http server options
	Protocol           Scheme
	Domain             string
	HttpAddr, HttpPort string
	SshPort            int
	CertFile, KeyFile  string
	RouterLogging      bool
	StaticRootPath     string
	EnableGzip         bool

	// Security settings.
	SecretKey          string
	LogInRememberDays  int
	CookieUserName     string
	CookieRememberName string

	// User settings
	AllowUserSignUp    bool
	AllowUserOrgCreate bool
	AutoAssignOrg      bool
	AutoAssignOrgRole  string

	// Http auth
	AdminUser     string
	AdminPassword string

	AnonymousEnabled bool
	AnonymousOrgName string
	AnonymousOrgRole string

	// Session settings.
	SessionOptions session.Options

	// Global setting objects.
	Cfg          *ini.File
	ConfRootPath string
	IsWindows    bool

	// PhantomJs Rendering
	ImagesDir  string
	PhantomDir string

	// for logging purposes
	configFiles                  []string
	appliedCommandLineProperties []string
	appliedEnvOverrides          []string

	ReportingEnabled  bool
	GoogleAnalyticsId string
)

type CommandLineArgs struct {
	Config string
	Args   []string
}

func init() {
	IsWindows = runtime.GOOS == "windows"
	log.NewLogger(0, "console", `{"level": 0}`)
	HomePath, _ = filepath.Abs(".")
}

func parseAppUrlAndSubUrl(section *ini.Section) (string, string) {
	appUrl := section.Key("root_url").MustString("http://localhost:3000/")
	if appUrl[len(appUrl)-1] != '/' {
		appUrl += "/"
	}

	// Check if has app suburl.
	url, err := url.Parse(appUrl)
	if err != nil {
		log.Fatal(4, "Invalid root_url(%s): %s", appUrl, err)
	}
	appSubUrl := strings.TrimSuffix(url.Path, "/")

	return appUrl, appSubUrl
}

func ToAbsUrl(relativeUrl string) string {
	return AppUrl + relativeUrl
}

func applyEnvVariableOverrides() {
	appliedEnvOverrides = make([]string, 0)
	for _, section := range Cfg.Sections() {
		for _, key := range section.Keys() {
			sectionName := strings.ToUpper(strings.Replace(section.Name(), ".", "_", -1))
			keyName := strings.ToUpper(strings.Replace(key.Name(), ".", "_", -1))
			envKey := fmt.Sprintf("GF_%s_%s", sectionName, keyName)
			envValue := os.Getenv(envKey)

			if len(envValue) > 0 {
				key.SetValue(envValue)
				appliedEnvOverrides = append(appliedEnvOverrides, fmt.Sprintf("%s=%s", envKey, envValue))
			}
		}
	}
}

func applyCommandLineDefaultProperties(props map[string]string) {
	appliedCommandLineProperties = make([]string, 0)
	for _, section := range Cfg.Sections() {
		for _, key := range section.Keys() {
			keyString := fmt.Sprintf("default.%s.%s", section.Name(), key.Name())
			value, exists := props[keyString]
			if exists {
				key.SetValue(value)
				appliedCommandLineProperties = append(appliedCommandLineProperties, fmt.Sprintf("%s=%s", keyString, value))
			}
		}
	}
}

func applyCommandLineProperties(props map[string]string) {
	for _, section := range Cfg.Sections() {
		for _, key := range section.Keys() {
			keyString := fmt.Sprintf("%s.%s", section.Name(), key.Name())
			value, exists := props[keyString]
			if exists {
				key.SetValue(value)
				appliedCommandLineProperties = append(appliedCommandLineProperties, fmt.Sprintf("%s=%s", keyString, value))
			}
		}
	}
}

func getCommandLineProperties(args []string) map[string]string {
	props := make(map[string]string)

	for _, arg := range args {
		if !strings.HasPrefix(arg, "cfg:") {
			continue
		}

		trimmed := strings.TrimPrefix(arg, "cfg:")
		parts := strings.Split(trimmed, "=")
		if len(parts) != 2 {
			log.Fatal(3, "Invalid command line argument", arg)
			return nil
		}

		props[parts[0]] = parts[1]
	}
	return props
}

func makeAbsolute(path string, root string) string {
	if filepath.IsAbs(path) {
		return path
	}
	return filepath.Join(root, path)
}

func evalEnvVarExpression(value string) string {
	regex := regexp.MustCompile(`\${(\w+)}`)
	return regex.ReplaceAllStringFunc(value, func(envVar string) string {
		envVar = strings.TrimPrefix(envVar, "${")
		envVar = strings.TrimSuffix(envVar, "}")
		envValue := os.Getenv(envVar)
		return envValue
	})
}

func evalConfigValues() {
	for _, section := range Cfg.Sections() {
		for _, key := range section.Keys() {
			key.SetValue(evalEnvVarExpression(key.Value()))
		}
	}
}

func loadConfiguration(args *CommandLineArgs) {
	var err error

	args.Config = evalEnvVarExpression(args.Config)

	// load config defaults
	defaultConfigFile := path.Join(HomePath, "conf/defaults.ini")
	configFiles = append(configFiles, defaultConfigFile)

	Cfg, err = ini.Load(defaultConfigFile)
	Cfg.BlockMode = true

	if err != nil {
		log.Fatal(3, "Failed to parse defaults.ini, %v", err)
	}

	// command line props
	commandLineProps := getCommandLineProperties(args.Args)

	// load default overrides
	applyCommandLineDefaultProperties(commandLineProps)

	// load specified config file
	if args.Config != "" {
		err = Cfg.Append(args.Config)
		if err != nil {
			log.Fatal(3, "Failed to parse %v, %v", args.Config, err)
		}
		configFiles = append(configFiles, args.Config)
		appliedCommandLineProperties = append(appliedCommandLineProperties, "config="+args.Config)
	}

	// apply environment overrides
	applyEnvVariableOverrides()

	// apply command line overrides
	applyCommandLineProperties(commandLineProps)

	// evaluate config values containing environment variables
	evalConfigValues()
}

func NewConfigContext(args *CommandLineArgs) {
	loadConfiguration(args)

	DataPath = makeAbsolute(Cfg.Section("paths").Key("data").String(), HomePath)

	initLogging(args)

	AppName = Cfg.Section("").Key("app_name").MustString("Grafana")
	Env = Cfg.Section("").Key("app_mode").MustString("development")

	server := Cfg.Section("server")
	AppUrl, AppSubUrl = parseAppUrlAndSubUrl(server)

	Protocol = HTTP
	if server.Key("protocol").MustString("http") == "https" {
		Protocol = HTTPS
		CertFile = server.Key("cert_file").String()
		KeyFile = server.Key("cert_key").String()
	}

	Domain = server.Key("domain").MustString("localhost")
	HttpAddr = server.Key("http_addr").MustString("0.0.0.0")
	HttpPort = server.Key("http_port").MustString("3000")

	StaticRootPath = server.Key("static_root_path").MustString(path.Join(HomePath, "public"))
	RouterLogging = server.Key("router_logging").MustBool(false)
	EnableGzip = server.Key("enable_gzip").MustBool(false)

	security := Cfg.Section("security")
	SecretKey = security.Key("secret_key").String()
	LogInRememberDays = security.Key("login_remember_days").MustInt()
	CookieUserName = security.Key("cookie_username").String()
	CookieRememberName = security.Key("cookie_remember_name").String()
	// admin
	AdminUser = security.Key("admin_user").String()
	AdminPassword = security.Key("admin_password").String()

	users := Cfg.Section("users")
	AllowUserSignUp = users.Key("allow_sign_up").MustBool(true)
	AllowUserOrgCreate = users.Key("allow_org_create").MustBool(true)
	AutoAssignOrg = users.Key("auto_assign_org").MustBool(true)
	AutoAssignOrgRole = users.Key("auto_assign_org_role").In("Editor", []string{"Editor", "Admin", "Viewer"})

	// anonymous access
	AnonymousEnabled = Cfg.Section("auth.anonymous").Key("enabled").MustBool(false)
	AnonymousOrgName = Cfg.Section("auth.anonymous").Key("org_name").String()
	AnonymousOrgRole = Cfg.Section("auth.anonymous").Key("org_role").String()

	// PhantomJS rendering
	ImagesDir = filepath.Join(DataPath, "png")
	PhantomDir = filepath.Join(HomePath, "vendor/phantomjs")

	analytics := Cfg.Section("analytics")
	ReportingEnabled = analytics.Key("reporting_enabled").MustBool(true)
	GoogleAnalyticsId = analytics.Key("google_analytics_ua_id").String()

	readSessionConfig()
}

func readSessionConfig() {
	sec := Cfg.Section("session")
	SessionOptions = session.Options{}
	SessionOptions.Provider = sec.Key("provider").In("memory", []string{"memory", "file", "redis", "mysql", "postgres"})
	SessionOptions.ProviderConfig = strings.Trim(sec.Key("provider_config").String(), "\" ")
	SessionOptions.CookieName = sec.Key("cookie_name").MustString("grafana_sess")
	SessionOptions.CookiePath = AppSubUrl
	SessionOptions.Secure = sec.Key("cookie_secure").MustBool()
	SessionOptions.Gclifetime = Cfg.Section("session").Key("gc_interval_time").MustInt64(86400)
	SessionOptions.Maxlifetime = Cfg.Section("session").Key("session_life_time").MustInt64(86400)
	SessionOptions.IDLength = 16

	if SessionOptions.Provider == "file" {
		SessionOptions.ProviderConfig = makeAbsolute(SessionOptions.ProviderConfig, DataPath)
		os.MkdirAll(path.Dir(SessionOptions.ProviderConfig), os.ModePerm)
	}

	if SessionOptions.CookiePath == "" {
		SessionOptions.CookiePath = "/"
	}
}

var logLevels = map[string]string{
	"Trace":    "0",
	"Debug":    "1",
	"Info":     "2",
	"Warn":     "3",
	"Error":    "4",
	"Critical": "5",
}

func initLogging(args *CommandLineArgs) {
	// Get and check log mode.
	LogModes = strings.Split(Cfg.Section("log").Key("mode").MustString("console"), ",")
	LogsPath = makeAbsolute(Cfg.Section("paths").Key("logs").String(), HomePath)

	LogConfigs = make([]string, len(LogModes))
	for i, mode := range LogModes {
		mode = strings.TrimSpace(mode)
		sec, err := Cfg.GetSection("log." + mode)
		if err != nil {
			log.Fatal(4, "Unknown log mode: %s", mode)
		}

		// Log level.
		levelName := Cfg.Section("log."+mode).Key("level").In("Trace",
			[]string{"Trace", "Debug", "Info", "Warn", "Error", "Critical"})
		level, ok := logLevels[levelName]
		if !ok {
			log.Fatal(4, "Unknown log level: %s", levelName)
		}

		// Generate log configuration.
		switch mode {
		case "console":
			LogConfigs[i] = fmt.Sprintf(`{"level":%s}`, level)
		case "file":
			logPath := sec.Key("file_name").MustString(path.Join(LogsPath, "grafana.log"))
			os.MkdirAll(path.Dir(logPath), os.ModePerm)
			LogConfigs[i] = fmt.Sprintf(
				`{"level":%s,"filename":"%s","rotate":%v,"maxlines":%d,"maxsize":%d,"daily":%v,"maxdays":%d}`, level,
				logPath,
				sec.Key("log_rotate").MustBool(true),
				sec.Key("max_lines").MustInt(1000000),
				1<<uint(sec.Key("max_size_shift").MustInt(28)),
				sec.Key("daily_rotate").MustBool(true),
				sec.Key("max_days").MustInt(7))
		case "conn":
			LogConfigs[i] = fmt.Sprintf(`{"level":%s,"reconnectOnMsg":%v,"reconnect":%v,"net":"%s","addr":"%s"}`, level,
				sec.Key("reconnect_on_msg").MustBool(),
				sec.Key("reconnect").MustBool(),
				sec.Key("protocol").In("tcp", []string{"tcp", "unix", "udp"}),
				sec.Key("addr").MustString(":7020"))
		case "smtp":
			LogConfigs[i] = fmt.Sprintf(`{"level":%s,"username":"%s","password":"%s","host":"%s","sendTos":"%s","subject":"%s"}`, level,
				sec.Key("user").MustString("example@example.com"),
				sec.Key("passwd").MustString("******"),
				sec.Key("host").MustString("127.0.0.1:25"),
				sec.Key("receivers").MustString("[]"),
				sec.Key("subject").MustString("Diagnostic message from serve"))
		case "database":
			LogConfigs[i] = fmt.Sprintf(`{"level":%s,"driver":"%s","conn":"%s"}`, level,
				sec.Key("driver").String(),
				sec.Key("conn").String())
		}

		log.NewLogger(Cfg.Section("log").Key("buffer_len").MustInt64(10000), mode, LogConfigs[i])
	}
}

func LogConfigurationInfo() {
	var text bytes.Buffer
	text.WriteString("Configuration Info\n")

	text.WriteString("Config files:\n")
	for i, file := range configFiles {
		text.WriteString(fmt.Sprintf("  [%d]: %s\n", i, file))
	}

	if len(appliedCommandLineProperties) > 0 {
		text.WriteString("Command lines overrides:\n")
		for i, prop := range appliedCommandLineProperties {
			text.WriteString(fmt.Sprintf("  [%d]: %s\n", i, prop))
		}
	}

	if len(appliedEnvOverrides) > 0 {
		text.WriteString("\tEnvironment variables used:\n")
		for i, prop := range appliedCommandLineProperties {
			text.WriteString(fmt.Sprintf("  [%d]: %s\n", i, prop))
		}
	}

	text.WriteString("Paths:\n")
	text.WriteString(fmt.Sprintf("  home: %s\n", HomePath))
	text.WriteString(fmt.Sprintf("  data: %s\n", DataPath))
	text.WriteString(fmt.Sprintf("  logs: %s\n", LogsPath))

	log.Info(text.String())
}