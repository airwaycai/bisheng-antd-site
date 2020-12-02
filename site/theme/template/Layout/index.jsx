import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { IntlProvider } from 'react-intl';
import { presetPalettes, presetDarkPalettes } from '@ant-design/colors';
import themeSwitcher from 'theme-switcher';
import { setTwoToneColor } from '@ant-design/icons';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import 'moment/locale/zh-cn';
import { ConfigProvider } from 'antd';
import { browserHistory } from 'bisheng/router';
import zhCN from 'antd/lib/locale/zh_CN';
import Header from './Header';
import SiteContext from './SiteContext';
import enLocale from '../../en-US';
import cnLocale from '../../zh-CN';
import * as utils from '../utils';
import 'antd/dist/antd.css';

if (typeof window !== 'undefined' && navigator.serviceWorker) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
  });
}

if (typeof window !== 'undefined') {
  // eslint-disable-next-line global-require
  require('../../static/style');

  // Expose to iframe
  window.react = React;
  window['react-dom'] = ReactDOM;
  // eslint-disable-next-line global-require
  window.antd = require('antd');
  // eslint-disable-next-line global-require
  window['@ant-design/icons'] = require('@ant-design/icons');
}

const RESPONSIVE_MOBILE = 768;

// for dark.css timestamp to remove cache
const timestamp = new Date().getTime();
const themeMap = {
  dark: `/dark.css?${timestamp}`,
  compact: `/compact.css?${timestamp}`,
};
const themeConfig = {
  themeMap,
};
const { switcher } = themeSwitcher(themeConfig);

export default class Layout extends React.Component {
  static contextType = SiteContext;

  isBeforeComponent = false;

  constructor(props) {
    super(props);
    const { pathname } = props.location;
    const appLocale = utils.isZhCN(pathname) ? cnLocale : enLocale;

    this.state = {
      appLocale,
      theme: 'default',
      setTheme: this.setTheme,
      direction: 'ltr',
      setIframeTheme: this.setIframeTheme,
    };
  }

  componentDidMount() {
    const { location, router } = this.props;
    router.listen(({ pathname, search }) => {
      const { theme } = this.props.location.query;
      const componentPage = /^\/?components/.test(pathname);

      // only component page can use `dark` theme
      if (!componentPage) {
        this.isBeforeComponent = false;
        this.setTheme('default', false);
      } else if (theme && !this.isBeforeComponent) {
        this.isBeforeComponent = true;
        this.setTheme(theme, false);
      }
    });

    if (location.query.theme && /^\/?components/.test(location.pathname)) {
      this.isBeforeComponent = true;
      this.setTheme(location.query.theme, false);
    } else {
      this.isBeforeComponent = false;
      this.setTheme('default', false);
    }

    if (location.query.direction) {
      this.setState({
        direction: location.query.direction,
      });
    } else {
      this.setState({
        direction: 'ltr',
      });
    }

    const nprogressHiddenStyle = document.getElementById('nprogress-style');
    if (nprogressHiddenStyle) {
      this.timer = setTimeout(() => {
        nprogressHiddenStyle.parentNode.removeChild(nprogressHiddenStyle);
      }, 0);
    }

    this.updateMobileMode();
    window.addEventListener('resize', this.updateMobileMode);
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
    window.removeEventListener('resize', this.updateMobileMode);
  }

  updateMobileMode = () => {
    const { isMobile } = this.state;
    const newIsMobile = window.innerWidth < RESPONSIVE_MOBILE;
    if (isMobile !== newIsMobile) {
      this.setState({
        isMobile: newIsMobile,
      });
    }
  };

  setIframeTheme = (iframeNode, theme) => {
    iframeNode.contentWindow.postMessage(
      JSON.stringify({
        action: 'change.theme',
        data: {
          themeConfig,
          theme,
        },
      }),
      '*',
    );
  };

  setTheme = (theme, persist = true) => {
    if (typeof window === 'undefined') {
      return;
    }

    switcher({
      theme,
      useStorage: persist,
    });

    const iframeNodes = document.querySelectorAll('.iframe-demo');
    // loop element node
    [].forEach.call(iframeNodes, iframeNode => {
      this.setIframeTheme(iframeNode, theme);
    });

    this.setState({
      theme,
    });
    const iconTwoToneThemeMap = {
      dark: [presetDarkPalettes.blue.primary, '#111d2c'],
      default: presetPalettes.blue.primary,
    };
    setTwoToneColor(iconTwoToneThemeMap[theme] || iconTwoToneThemeMap.default);
  };

  changeDirection = direction => {
    this.setState({
      direction,
    });
    const { pathname, hash, query } = this.props.location;
    if (direction === 'ltr') {
      delete query.direction;
    } else {
      query.direction = 'rtl';
    }
    browserHistory.push({
      pathname: `/${pathname}`,
      query,
      hash,
    });
  };

  render() {
    const { children, helmetContext = {}, ...restProps } = this.props;
    const { appLocale, direction, isMobile, theme, setTheme, setIframeTheme } = this.state;
    const title =
      appLocale.locale === 'zh-CN'
        ? 'Ant Design - 一套企业级 UI 设计语言和 React 组件库'
        : "Ant Design - The world's second most popular React UI framework";
    const description =
      appLocale.locale === 'zh-CN'
        ? '基于 Ant Design 设计体系的 React UI 组件库，用于研发企业级中后台产品。'
        : 'An enterprise-class UI design language and React UI library with a set of high-quality React components, one of best React UI library for enterprises';
    return (
      <SiteContext.Provider value={{ isMobile, direction, theme, setTheme, setIframeTheme }}>
        <HelmetProvider context={helmetContext}>
          <Helmet encodeSpecialCharacters={false}>
            <html
              lang={appLocale.locale === 'zh-CN' ? 'zh' : 'en'}
              data-direction={direction}
              className={classNames({
                [`rtl`]: direction === 'rtl',
              })}
            />
            <title>{title}</title>
            <link
              rel="apple-touch-icon-precomposed"
              sizes="144x144"
            />
            <meta name="description" content={description} />
            <meta property="og:title" content={title} />
            <meta property="og:type" content="website" />
            <meta
              property="og:image"
            />
          </Helmet>
          <IntlProvider
            locale={appLocale.locale}
            messages={appLocale.messages}
            defaultLocale="en-US"
          >
            <ConfigProvider
              locale={appLocale.locale === 'zh-CN' ? zhCN : null}
              direction={direction}
            >
              <Header {...restProps} changeDirection={this.changeDirection} />
              {children}
            </ConfigProvider>
          </IntlProvider>
        </HelmetProvider>
      </SiteContext.Provider>
    );
  }
}
